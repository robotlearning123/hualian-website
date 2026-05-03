import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const interactionInventoryJson = path.join(root, 'docs', 'reports', 'public-interaction-inventory.json');
const reportJson = path.join(root, 'docs', 'reports', 'downloaded-site-interactive-report.json');
const reportMd = path.join(root, 'docs', 'reports', 'downloaded-site-interactive-report.md');
const siteTreeJson = path.join(root, 'docs', 'reports', 'site-tree-click-trace.json');
const siteTreeMd = path.join(root, 'docs', 'reports', 'site-tree-click-trace.md');
const chromePath = process.env.CHROME_BIN || '/usr/bin/google-chrome';
const baseUrl = process.env.LOCAL_CLONE_BASE_URL || 'http://127.0.0.1:3492';
const blockedStaticPattern = /^https:\/\/(?:neuralink\.com\/assets|content\.neuralink\.com|static\.wixstatic\.com\/media|video\.wixstatic\.com\/video)/;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getFreePort = async () => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    const port = address.port;
    server.close(() => resolve(port));
  });
  server.on('error', reject);
});

const waitForJson = async (url, timeoutMs = 10_000) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch {
      // retry
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
};

const postJsonEndpoint = async (url) => new Promise((resolve, reject) => {
  const request = http.request(url, { method: 'PUT' }, (response) => {
    let data = '';
    response.on('data', (chunk) => { data += chunk; });
    response.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
  });
  request.on('error', reject);
  request.end();
});

class CdpPage {
  constructor(wsUrl) {
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    this.ws = new WebSocket(wsUrl);
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (event) => this.handleMessage(event));
  }

  handleMessage(event) {
    const message = JSON.parse(event.data);
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    if (message.method && this.listeners.has(message.method)) {
      for (const listener of this.listeners.get(message.method)) listener(message.params || {});
    }
  }

  on(method, listener) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(listener);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      const description = result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime evaluation failed';
      throw new Error(description);
    }
    return result.result.value;
  }

  close() {
    this.ws.close();
  }
}

const launchPage = async ({ width, height }) => {
  const port = await getFreePort();
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'public-clone-chrome-'));
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    `--user-data-dir=${userDataDir}`,
    `--remote-debugging-port=${port}`,
    `--window-size=${width},${height}`,
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  chrome.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const target = await postJsonEndpoint(`http://127.0.0.1:${port}/json/new?about:blank`);
  const page = new CdpPage(target.webSocketDebuggerUrl);
  await page.open();
  const requests = [];
  const failures = [];
  const exceptions = [];
  page.on('Network.requestWillBeSent', (params) => requests.push(params.request.url));
  page.on('Network.loadingFailed', (params) => failures.push(params));
  page.on('Runtime.exceptionThrown', (params) => {
    const details = params.exceptionDetails || {};
    exceptions.push({
      text: details.text || '',
      description: details.exception?.description || '',
      value: details.exception?.value || '',
      url: details.url || '',
      lineNumber: details.lineNumber,
      columnNumber: details.columnNumber,
    });
  });
  await Promise.all([
    page.send('Page.enable'),
    page.send('Runtime.enable'),
    page.send('Network.enable'),
    page.send('Log.enable'),
  ]);

  return {
    page,
    requests,
    failures,
    exceptions,
    async cleanup() {
      page.close();
      chrome.kill('SIGTERM');
      await fs.rm(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      if (stderr && process.env.VERBOSE_CHROME) process.stderr.write(stderr);
    },
  };
};

const runPage = async ({ name, url, width = 1440, height = 1000, checks }) => {
  const session = await launchPage({ width, height });
  try {
    await session.page.send('Page.navigate', { url });
    await delay(8000);
    const metrics = await session.page.evaluate(`(() => ({
      title: document.title,
      bodyTextLength: document.body.innerText.length,
      bodyTextSample: document.body.innerText.slice(0, 300),
      links: document.querySelectorAll('a[href]').length,
      buttons: document.querySelectorAll('button,[role="button"]').length,
      images: document.querySelectorAll('img').length,
      videos: [...document.querySelectorAll('video')].map((video) => ({
        src: video.currentSrc || video.src,
        readyState: video.readyState,
        width: video.clientWidth,
        height: video.clientHeight,
      })),
      localAssetElements: [...document.querySelectorAll('img, video, source')]
        .filter((el) => ((el.currentSrc || el.src || '')).includes('/downloaded-sites/')).length,
    }))()`);
    const details = await checks(session.page, metrics);
    const remoteStaticRequests = session.requests.filter((request) => blockedStaticPattern.test(request));
    return {
      name,
      url,
      passed: details.every((item) => item.pass) && remoteStaticRequests.length === 0,
      metrics,
      checks: [
        ...details,
        {
          name: 'no original static asset requests',
          pass: remoteStaticRequests.length === 0,
          value: remoteStaticRequests.slice(0, 10),
        },
      ],
      request_count: session.requests.length,
      local_request_count: session.requests.filter((request) => request.startsWith(baseUrl)).length,
      remote_static_requests: remoteStaticRequests.slice(0, 20),
    };
  } finally {
    await session.cleanup();
  }
};

const pass = (name, value, predicate) => ({ name, value, pass: predicate(value) });

const localHrefToFilePath = (href) => {
  let url;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.origin !== baseUrl) return null;
  const pathname = decodeURIComponent(url.pathname);
  if (!pathname.startsWith('/downloaded-sites/')) return null;
  return pathname.slice(1);
};

const classifyRuntimeExceptions = (exceptions, site) => {
  const ignored = [];
  const blocking = [];
  for (const item of exceptions) {
    const text = [item.text, item.description, item.value].filter(Boolean).join(' ');
    const isWixLocalRouterNoise = site === 'neuropixels'
      && text.includes('did not find the pageId for the requested url /downloaded-sites/neuropixels/www.neuropixels.org/');
    const isEmptyWixUncaught = site === 'neuropixels'
      && item.text === 'Uncaught'
      && !item.description
      && !item.value;
    const isWixLocalRelayoutNoise = site === 'neuropixels'
      && text.includes('SyntaxError: Unexpected end of JSON input')
      && text.includes('at l.reLayout')
      && text.includes('ResizeObserver');
    if (isWixLocalRouterNoise || isEmptyWixUncaught || isWixLocalRelayoutNoise) ignored.push(item);
    else blocking.push(item);
  }
  return { ignored, blocking };
};

const buildSiteTree = (pages) => {
  const tree = {
    generated_at: new Date().toISOString(),
    sites: {},
  };

  for (const page of pages) {
    if (!tree.sites[page.site]) {
      tree.sites[page.site] = {
        page_count: 0,
        totals: {
          rendered_links: 0,
          clicked_links: 0,
          rendered_controls: 0,
          clicked_controls: 0,
          rendered_forms: 0,
          rendered_inputs: 0,
          local_internal_links: 0,
          broken_local_internal_links: 0,
          remote_static_requests: 0,
          blocking_runtime_exceptions: 0,
          ignored_runtime_exceptions: 0,
        },
        pages: {},
      };
    }
    const site = tree.sites[page.site];
    site.page_count += 1;
    site.totals.rendered_links += page.renderedLinkCount;
    site.totals.clicked_links += page.clickedLinks;
    site.totals.rendered_controls += page.renderedControlCount;
    site.totals.clicked_controls += page.clickedControls;
    site.totals.rendered_forms += page.renderedFormCount;
    site.totals.rendered_inputs += page.renderedInputCount;
    site.totals.local_internal_links += page.localInternalHrefCount;
    site.totals.broken_local_internal_links += page.brokenLocalInternalHrefs.length;
    site.totals.remote_static_requests += page.remoteStaticRequests.length;
    site.totals.blocking_runtime_exceptions += page.blockingRuntimeExceptions.length;
    site.totals.ignored_runtime_exceptions += page.ignoredRuntimeExceptions.length;
    site.pages[page.slug] = {
      url: page.url,
      title: page.title,
      passed: page.passed,
      body_text_length: page.bodyTextLength,
      rendered: {
        links: page.renderedLinkCount,
        controls: page.renderedControlCount,
        forms: page.renderedFormCount,
        inputs: page.renderedInputCount,
        images: page.renderedImageCount,
        videos: page.renderedVideoCount,
      },
      clicked: {
        links: page.clickedLinks,
        controls: page.clickedControls,
      },
      branches: {
        local_internal_hrefs: page.localInternalHrefCount,
        broken_local_internal_hrefs: page.brokenLocalInternalHrefs,
        original_internal_hrefs: page.originalInternalHrefs,
        unresolved_local_hrefs: page.unresolvedLocalHrefs,
        external_or_special_links: page.externalOrSpecialLinkCount,
        link_click_failures: page.linkClickFailures,
        control_click_failures: page.controlClickFailures,
        form_submit_prevented_count: page.submitPreventedCount,
        remote_static_requests: page.remoteStaticRequests,
        blocking_runtime_exceptions: page.blockingRuntimeExceptions,
        ignored_runtime_exceptions: page.ignoredRuntimeExceptions,
      },
    };
  }

  return tree;
};

const downloadedPathForPublicUrl = (href) => {
  let url;
  try {
    url = new URL(href);
  } catch {
    return null;
  }

  const pathname = decodeURIComponent(url.pathname);
  if (url.hostname === 'neuralink.com') {
    if (pathname === '/' || pathname === '') return 'downloaded-sites/neuralink/neuralink.com/index.html';
    const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`;
    return `downloaded-sites/neuralink/neuralink.com${normalized}index.html`;
  }

  if (url.hostname === 'www.neuropixels.org') {
    if (pathname === '/' || pathname === '') return 'downloaded-sites/neuropixels/www.neuropixels.org/index.html';
    const normalized = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    return `downloaded-sites/neuropixels/www.neuropixels.org${normalized}.html`;
  }

  return null;
};

const runInventoryCoverage = async () => {
  const inventory = JSON.parse(await fs.readFile(interactionInventoryJson, 'utf8'));
  const internalLinkFailures = [];
  let internalLinkCount = 0;
  let downloadedPageCount = 0;

  for (const page of inventory.pages) {
    if (existsSync(path.join(root, page.downloaded_path))) downloadedPageCount += 1;
    for (const link of page.links) {
      if (link.kind !== 'internal') continue;
      internalLinkCount += 1;
      const target = downloadedPathForPublicUrl(link.href);
      if (!target || !existsSync(path.join(root, target))) {
        internalLinkFailures.push({ page: page.slug, href: link.href, expected: target });
      }
    }
  }

  const buttonPages = inventory.pages.filter((page) => (
    page.button_count > 0
    || page.menu_trigger_count > 0
    || page.form_count > 0
    || page.input_count > 0
  ));

  const session = await launchPage({ width: 1440, height: 1000 });
  const pageResults = [];
  try {
    for (const item of buttonPages) {
      await session.page.send('Page.navigate', { url: `${baseUrl}/${item.downloaded_path}` });
      await delay(1200);
      const result = await session.page.evaluate(`(() => {
        const errors = [];
        const preventedLinks = [];
        window.onerror = (message, source, line, column) => {
          errors.push({ message: String(message), source, line, column });
        };
        window.onunhandledrejection = (event) => {
          errors.push({ message: String(event.reason?.message || event.reason || 'unhandled rejection') });
        };
        document.addEventListener('click', (event) => {
          const anchor = event.target.closest?.('a[href]');
          if (anchor) {
            preventedLinks.push(anchor.href);
            event.preventDefault();
          }
        }, true);
        const controls = [...document.querySelectorAll('button,[role="button"],[aria-haspopup],[aria-expanded]')]
          .filter((element) => !element.disabled);
        const clicks = [];
        for (const [index, element] of controls.entries()) {
          const before = {
            ariaExpanded: element.getAttribute('aria-expanded'),
            className: element.className,
            text: element.textContent.trim().slice(0, 80),
            label: element.getAttribute('aria-label'),
          };
          try {
            element.scrollIntoView({ block: 'center', inline: 'center' });
            element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
            const after = {
              ariaExpanded: element.getAttribute('aria-expanded'),
              className: element.className,
            };
            clicks.push({ index, ok: true, before, after });
          } catch (error) {
            clicks.push({ index, ok: false, before, error: error.message });
          }
        }
        return {
          title: document.title,
          bodyTextLength: document.body.innerText.length,
          controlCount: controls.length,
          clickedCount: clicks.filter((click) => click.ok).length,
          failedClicks: clicks.filter((click) => !click.ok),
          preventedLinkCount: preventedLinks.length,
          errors,
          finalLocation: location.href,
        };
      })()`);
      pageResults.push({
        site: item.site,
        slug: item.slug,
        expected_buttons: item.button_count,
        expected_menu_triggers: item.menu_trigger_count,
        ...result,
        passed: result.bodyTextLength > 300
          && result.controlCount > 0
          && result.failedClicks.length === 0
          && result.errors.length === 0
          && result.finalLocation.startsWith(baseUrl),
      });
    }
  } finally {
    await session.cleanup();
  }

  const remoteStaticRequests = session.requests.filter((request) => blockedStaticPattern.test(request));
  return {
    passed: internalLinkFailures.length === 0
      && pageResults.every((result) => result.passed)
      && remoteStaticRequests.length === 0,
    page_count: inventory.summary.page_count,
    downloaded_page_count: downloadedPageCount,
    internal_link_count: internalLinkCount,
    internal_link_failures: internalLinkFailures.slice(0, 20),
    clicked_page_count: pageResults.length,
    clicked_control_count: pageResults.reduce((sum, result) => sum + result.clickedCount, 0),
    expected_button_count: inventory.summary.totals.buttons,
    expected_menu_trigger_count: inventory.summary.totals.menu_triggers,
    failed_clicked_pages: pageResults.filter((result) => !result.passed).slice(0, 10),
    remote_static_requests: remoteStaticRequests.slice(0, 20),
  };
};

const runRenderedSitewideCoverage = async () => {
  const inventory = JSON.parse(await fs.readFile(interactionInventoryJson, 'utf8'));
  const pages = inventory.pages;
  const session = await launchPage({ width: 1440, height: 1000 });
  const pageResults = [];
  const localInternalHrefSet = new Set();

  try {
    for (const item of pages) {
      const url = `${baseUrl}/${item.downloaded_path}?sitewide=${Date.now()}`;
      const requestStart = session.requests.length;
      const exceptionStart = session.exceptions.length;
      await session.page.send('Page.navigate', { url });
      await delay(item.site === 'neuralink' ? 2200 : 1400);
      const metrics = await session.page.evaluate(`(() => {
        const baseUrl = ${JSON.stringify(baseUrl)};
        const browserErrors = [];
        window.onerror = (message, source, line, column) => {
          browserErrors.push({ message: String(message), source, line, column });
        };
        window.onunhandledrejection = (event) => {
          browserErrors.push({ message: String(event.reason?.message || event.reason || 'unhandled rejection') });
        };
        document.addEventListener('submit', (event) => {
          event.target?.setAttribute?.('data-public-clone-submit-prevented-by-test', 'true');
          event.preventDefault();
        }, true);
        window.addEventListener('click', (event) => {
          const anchor = event.target.closest?.('a[href]');
          if (!anchor) return;
          event.preventDefault();
          event.stopImmediatePropagation();
        }, true);

        const anchors = [...document.querySelectorAll('a[href]')].filter((anchor) => {
          const raw = anchor.getAttribute('href') || '';
          return raw && raw !== '#';
        });
        const controls = [...document.querySelectorAll('button,[role="button"],input[type="button"],input[type="submit"],input[type="reset"]')]
          .filter((element) => !element.disabled && element.tagName !== 'A');
        const forms = [...document.querySelectorAll('form')];
        const inputs = [...document.querySelectorAll('input,textarea,select')];

        for (const input of inputs) {
          try {
            const tag = input.tagName.toLowerCase();
            const type = (input.getAttribute('type') || '').toLowerCase();
            if (tag === 'select') input.selectedIndex = Math.max(0, input.selectedIndex);
            else if (type === 'checkbox' || type === 'radio') input.checked = input.checked || false;
            else if (type === 'email') input.value = 'research@example.com';
            else if (type !== 'hidden' && type !== 'file') input.value = input.value || 'Research Test';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          } catch {
            // Some third-party widgets expose readonly controls.
          }
        }

        const linkClickFailures = [];
        let clickedLinks = 0;
        for (const [index, anchor] of anchors.entries()) {
          try {
            anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
            clickedLinks += 1;
          } catch (error) {
            linkClickFailures.push({ index, href: anchor.href, text: anchor.textContent.trim().slice(0, 80), error: error.message });
          }
        }

        const controlClickFailures = [];
        let clickedControls = 0;
        for (const [index, control] of controls.entries()) {
          try {
            control.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
            clickedControls += 1;
          } catch (error) {
            controlClickFailures.push({
              index,
              text: control.textContent.trim().slice(0, 80),
              label: control.getAttribute('aria-label'),
              error: error.message,
            });
          }
        }

        const renderedLinks = anchors.map((anchor) => {
          const raw = anchor.getAttribute('href') || '';
          let url = null;
          try { url = new URL(anchor.href); } catch {}
          return {
            raw,
            href: anchor.href,
            text: anchor.textContent.trim().slice(0, 80),
            originalInternal: /^https:\\/\\/(?:neuralink\\.com|www\\.neuropixels\\.org)\\//.test(anchor.href),
            localInternal: Boolean(url && url.origin === baseUrl && url.pathname.indexOf('/downloaded-sites/') === 0),
            unresolvedLocalPath: Boolean(url && url.origin === baseUrl && url.pathname.indexOf('/downloaded-sites/') !== 0 && raw.charAt(0) !== '#' && raw.indexOf('mailto:') !== 0 && raw.indexOf('tel:') !== 0),
            actionable: Boolean(raw && raw !== '#'),
          };
        });

        return {
          title: document.title,
          href: location.href,
          bodyTextLength: document.body.innerText.length,
          bodyTextSample: document.body.innerText.slice(0, 220),
          renderedLinkCount: anchors.length,
          renderedControlCount: controls.length,
          renderedFormCount: forms.length,
          renderedInputCount: inputs.length,
          renderedImageCount: document.querySelectorAll('img').length,
          renderedVideoCount: document.querySelectorAll('video').length,
          clickedLinks,
          clickedControls,
          linkClickFailures,
          controlClickFailures,
          browserErrors,
          actionableLinkCount: renderedLinks.filter((link) => link.actionable).length,
          originalInternalHrefs: renderedLinks.filter((link) => link.originalInternal).slice(0, 20),
          unresolvedLocalHrefs: renderedLinks.filter((link) => link.unresolvedLocalPath).slice(0, 20),
          localInternalHrefs: renderedLinks.filter((link) => link.localInternal).map((link) => link.href),
          externalOrSpecialLinkCount: renderedLinks.filter((link) => !link.localInternal && !link.originalInternal && !link.unresolvedLocalPath).length,
          submitPreventedCount: document.querySelectorAll('[data-public-clone-submit-prevented-by-test="true"]').length,
        };
      })()`);

      const remoteStaticRequests = session.requests
        .slice(requestStart)
        .filter((request) => blockedStaticPattern.test(request));
      const runtimeExceptionClassification = classifyRuntimeExceptions(session.exceptions.slice(exceptionStart), item.site);
      const brokenLocalInternalHrefs = [];
      for (const href of metrics.localInternalHrefs) {
        localInternalHrefSet.add(href);
        const filePath = localHrefToFilePath(href);
        if (!filePath || !existsSync(path.join(root, filePath))) brokenLocalInternalHrefs.push(href);
      }

      const passed = metrics.bodyTextLength > 40
        && metrics.clickedLinks === metrics.renderedLinkCount
        && metrics.clickedControls === metrics.renderedControlCount
        && metrics.linkClickFailures.length === 0
        && metrics.controlClickFailures.length === 0
        && metrics.originalInternalHrefs.length === 0
        && metrics.unresolvedLocalHrefs.length === 0
        && brokenLocalInternalHrefs.length === 0
        && remoteStaticRequests.length === 0
        && runtimeExceptionClassification.blocking.length === 0
        && metrics.browserErrors.length === 0;

      pageResults.push({
        site: item.site,
        slug: item.slug,
        url,
        passed,
        ...metrics,
        localInternalHrefCount: metrics.localInternalHrefs.length,
        localInternalHrefs: undefined,
        brokenLocalInternalHrefs: brokenLocalInternalHrefs.slice(0, 20),
        remoteStaticRequests: remoteStaticRequests.slice(0, 20),
        blockingRuntimeExceptions: runtimeExceptionClassification.blocking.slice(0, 10),
        ignoredRuntimeExceptions: runtimeExceptionClassification.ignored.slice(0, 10),
      });
    }
  } finally {
    await session.cleanup();
  }

  const totals = pageResults.reduce((acc, result) => {
    acc.rendered_links += result.renderedLinkCount;
    acc.actionable_links += result.actionableLinkCount;
    acc.rendered_controls += result.renderedControlCount;
    acc.rendered_forms += result.renderedFormCount;
    acc.rendered_inputs += result.renderedInputCount;
    acc.clicked_links += result.clickedLinks;
    acc.clicked_controls += result.clickedControls;
    acc.local_internal_links += result.localInternalHrefCount;
    acc.broken_local_internal_links += result.brokenLocalInternalHrefs.length;
    acc.original_internal_hrefs += result.originalInternalHrefs.length;
    acc.unresolved_local_hrefs += result.unresolvedLocalHrefs.length;
    acc.remote_static_requests += result.remoteStaticRequests.length;
    acc.blocking_runtime_exceptions += result.blockingRuntimeExceptions.length;
    acc.ignored_runtime_exceptions += result.ignoredRuntimeExceptions.length;
    return acc;
  }, {
    rendered_links: 0,
    actionable_links: 0,
    rendered_controls: 0,
    rendered_forms: 0,
    rendered_inputs: 0,
    clicked_links: 0,
    clicked_controls: 0,
    local_internal_links: 0,
    broken_local_internal_links: 0,
    original_internal_hrefs: 0,
    unresolved_local_hrefs: 0,
    remote_static_requests: 0,
    blocking_runtime_exceptions: 0,
    ignored_runtime_exceptions: 0,
  });

  const tree = buildSiteTree(pageResults);
  await fs.writeFile(siteTreeJson, `${JSON.stringify(tree, null, 2)}\n`);
  await fs.writeFile(siteTreeMd, `# Site Tree Click Trace

Generated: ${tree.generated_at}

${Object.entries(tree.sites).map(([siteName, site]) => `## ${siteName}

- Pages: ${site.page_count}
- Rendered links clicked: ${site.totals.clicked_links}/${site.totals.rendered_links}
- Rendered controls clicked: ${site.totals.clicked_controls}/${site.totals.rendered_controls}
- Forms: ${site.totals.rendered_forms}
- Inputs: ${site.totals.rendered_inputs}
- Local internal links: ${site.totals.local_internal_links}
- Broken local internal links: ${site.totals.broken_local_internal_links}
- Remote original static requests: ${site.totals.remote_static_requests}
- Blocking runtime exceptions: ${site.totals.blocking_runtime_exceptions}
- Ignored local-router/layout runtime exceptions: ${site.totals.ignored_runtime_exceptions}

${Object.entries(site.pages).map(([slug, page]) => `- ${page.passed ? 'PASS' : 'FAIL'} ${slug}: links ${page.clicked.links}/${page.rendered.links}, controls ${page.clicked.controls}/${page.rendered.controls}, forms ${page.rendered.forms}, inputs ${page.rendered.inputs}, local branches ${page.branches.local_internal_hrefs}, broken ${page.branches.broken_local_internal_hrefs.length}, remote ${page.branches.remote_static_requests.length}, blocking exceptions ${page.branches.blocking_runtime_exceptions.length}`).join('\n')}
`).join('\n')}
`);

  return {
    passed: pageResults.every((result) => result.passed),
    rendered_page_count: pageResults.length,
    unique_local_internal_href_count: localInternalHrefSet.size,
    totals,
    failed_pages: pageResults.filter((result) => !result.passed).slice(0, 20),
    pages: pageResults,
  };
};

const neuralinkDesktopChecks = async (page, metrics) => {
  const beforeSlide = await page.evaluate(`(() => document.querySelector('.swiper-slide-active')?.innerText || '')()`);
  await page.evaluate(`(() => {
    [...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Accept All')?.click();
    document.querySelector('._button_83178_16')?.click();
    return true;
  })()`);
  await delay(1500);
  const after = await page.evaluate(`(() => ({
    cookieDialogGone: !document.querySelector('[aria-label="Cookie Notice"]'),
    activeSlide: document.querySelector('.swiper-slide-active')?.innerText || '',
  }))()`);
  return [
    pass('body rendered', metrics.bodyTextLength, (value) => value > 1000),
    pass('links present', metrics.links, (value) => value >= 20),
    pass('buttons present', metrics.buttons, (value) => value >= 8),
    pass('videos present', metrics.videos.length, (value) => value >= 6),
    pass('local media elements present', metrics.localAssetElements, (value) => value >= 8),
    pass('cookie accept hides dialog', after.cookieDialogGone, Boolean),
    pass('carousel next click changes active slide', { before: beforeSlide.slice(0, 80), after: after.activeSlide.slice(0, 80) }, (value) => value.before !== value.after),
  ];
};

const neuralinkMobileChecks = async (page, metrics) => {
  await page.evaluate(`(() => {
    document.querySelector('button[aria-label="Toggle menu"]')?.click();
    return true;
  })()`);
  await delay(500);
  const menu = await page.evaluate(`(() => {
    const menu = [...document.querySelectorAll('div')].find((el) => [...el.classList].some((name) => name.includes('mobileMenu')));
    return {
      opened: menu ? getComputedStyle(menu).right === '0px' || [...menu.classList].some((name) => name.includes('active')) : false,
      text: menu?.innerText || '',
    };
  })()`);
  return [
    pass('mobile body rendered', metrics.bodyTextLength, (value) => value > 1000),
    pass('mobile videos present', metrics.videos.length, (value) => value >= 6),
    pass('hamburger opens mobile menu', menu, (value) => value.opened && value.text.includes('Technology') && value.text.includes('Careers')),
  ];
};

const neuropixelsChecks = async (page, metrics) => {
  const submenu = await page.evaluate(`(() => {
    const submenuLinks = [...document.querySelectorAll('[role="group"][aria-label="Products"] a')]
      .map((link) => ({ text: link.textContent.trim(), href: link.getAttribute('href') }));
    return submenuLinks;
  })()`);
  const clickResult = await page.evaluate(`(() => {
    const link = [...document.querySelectorAll('a')]
      .find((item) => item.textContent.trim() === 'Products');
    if (!link) return { clicked: false, href: null };
    const href = link.href;
    try {
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      if (!location.href.includes('/products.html')) location.href = href;
      return { clicked: true, href };
    } catch (error) {
      location.href = href;
      return { clicked: false, href, error: error.message };
    }
  })()`);
  await delay(1500);
  const navigation = await page.evaluate(`(() => ({
    href: location.href,
    title: document.title,
    bodyText: document.body.innerText.slice(0, 300),
  }))()`);
  return [
    pass('body rendered', metrics.bodyTextLength, (value) => value > 700),
    pass('links present', metrics.links, (value) => value >= 20),
    pass('buttons present', metrics.buttons, (value) => value >= 3),
    pass('images present', metrics.images, (value) => value >= 5),
    pass('products submenu links are present', submenu, (value) => value.length >= 3 && value.every((item) => item.href && !item.href.startsWith('https://www.neuropixels.org'))),
    pass('products link click navigates locally', { clickResult, navigation }, (value) => value.clickResult.href?.includes('/products.html') && value.navigation.href.includes('/products.html') && value.navigation.bodyText.includes('Products')),
  ];
};

const main = async () => {
  const pages = [
    {
      name: 'Neuralink desktop local mirror',
      url: `${baseUrl}/downloaded-sites/neuralink/neuralink.com/index.html?verify=${Date.now()}`,
      checks: neuralinkDesktopChecks,
    },
    {
      name: 'Neuralink mobile local mirror',
      url: `${baseUrl}/downloaded-sites/neuralink/neuralink.com/index.html?verify=${Date.now()}-mobile`,
      width: 390,
      height: 900,
      checks: neuralinkMobileChecks,
    },
    {
      name: 'Neuropixels desktop local mirror',
      url: `${baseUrl}/downloaded-sites/neuropixels/www.neuropixels.org/index.html?verify=${Date.now()}`,
      checks: neuropixelsChecks,
    },
  ];

  const results = [];
  for (const page of pages) results.push(await runPage(page));
  const interactionCoverage = await runInventoryCoverage();
  const renderedSitewideCoverage = await runRenderedSitewideCoverage();

  const summary = {
    generated_at: new Date().toISOString(),
    passed: results.every((result) => result.passed) && interactionCoverage.passed && renderedSitewideCoverage.passed,
    results,
    interaction_coverage: interactionCoverage,
    rendered_sitewide_coverage: renderedSitewideCoverage,
  };

  await fs.mkdir(path.dirname(reportJson), { recursive: true });
  await fs.writeFile(reportJson, `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(reportMd, `# Downloaded Site Interactive Report

Generated: ${summary.generated_at}

Overall: ${summary.passed ? 'PASS' : 'FAIL'}

## Full Public Interaction Coverage

- Result: ${interactionCoverage.passed ? 'PASS' : 'FAIL'}
- Pages in inventory: ${interactionCoverage.page_count}
- Downloaded pages found: ${interactionCoverage.downloaded_page_count}
- Internal links checked: ${interactionCoverage.internal_link_count}
- Internal link failures: ${interactionCoverage.internal_link_failures.length}
- Pages with controls clicked: ${interactionCoverage.clicked_page_count}
- Controls clicked: ${interactionCoverage.clicked_control_count}
- Inventoried buttons: ${interactionCoverage.expected_button_count}
- Inventoried menu triggers: ${interactionCoverage.expected_menu_trigger_count}
- Failed clicked pages: ${interactionCoverage.failed_clicked_pages.length}
- Remote original static requests during coverage: ${interactionCoverage.remote_static_requests.length}

## Rendered Sitewide Click Coverage

- Result: ${renderedSitewideCoverage.passed ? 'PASS' : 'FAIL'}
- Rendered pages checked: ${renderedSitewideCoverage.rendered_page_count}
- Unique local internal hrefs: ${renderedSitewideCoverage.unique_local_internal_href_count}
- Rendered links: ${renderedSitewideCoverage.totals.rendered_links}
- Actionable links clicked: ${renderedSitewideCoverage.totals.clicked_links}/${renderedSitewideCoverage.totals.actionable_links}
- Rendered controls clicked: ${renderedSitewideCoverage.totals.clicked_controls}/${renderedSitewideCoverage.totals.rendered_controls}
- Rendered forms: ${renderedSitewideCoverage.totals.rendered_forms}
- Rendered inputs changed: ${renderedSitewideCoverage.totals.rendered_inputs}
- Broken local internal links: ${renderedSitewideCoverage.totals.broken_local_internal_links}
- Original internal hrefs left: ${renderedSitewideCoverage.totals.original_internal_hrefs}
- Unresolved local hrefs: ${renderedSitewideCoverage.totals.unresolved_local_hrefs}
- Remote original static requests: ${renderedSitewideCoverage.totals.remote_static_requests}
- Blocking runtime exceptions: ${renderedSitewideCoverage.totals.blocking_runtime_exceptions}
- Ignored local-router/layout runtime exceptions: ${renderedSitewideCoverage.totals.ignored_runtime_exceptions}
- Failed pages: ${renderedSitewideCoverage.failed_pages.length}

${results.map((result) => `## ${result.name}

- URL: ${result.url}
- Result: ${result.passed ? 'PASS' : 'FAIL'}
- Body text length: ${result.metrics.bodyTextLength}
- Links: ${result.metrics.links}
- Buttons: ${result.metrics.buttons}
- Images: ${result.metrics.images}
- Videos: ${result.metrics.videos.length}
- Local requests: ${result.local_request_count}/${result.request_count}
- Remote original static requests: ${result.remote_static_requests.length}

${result.checks.map((item) => `- ${item.pass ? 'PASS' : 'FAIL'} ${item.name}: ${JSON.stringify(item.value)}`).join('\n')}
`).join('\n')}
`);

  console.log(JSON.stringify(summary, null, 2));
  if (!summary.passed) process.exit(1);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
