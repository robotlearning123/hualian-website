import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';

const root = process.cwd();
const chromePath = process.env.CHROME_BIN || '/usr/bin/google-chrome';
const baseUrl = process.env.LOCAL_CLONE_BASE_URL || 'http://127.0.0.1:3492';
const reportId = process.env.COMPARE_REPORT_ID || 'live-vs-local-site-report';
const cloneLabel = process.env.COMPARE_TARGET_LABEL || baseUrl;
const screenshotDirName = process.env.COMPARE_SCREENSHOT_DIR
  || (reportId === 'live-vs-local-site-report'
    ? 'live-vs-local-screenshots'
    : reportId.replace(/-site-report$/, '-screenshots'));
const reportJson = path.join(root, 'docs', 'reports', `${reportId}.json`);
const reportMd = path.join(root, 'docs', 'reports', `${reportId}.md`);
const screenshotRoot = path.join(root, 'docs', 'reports', screenshotDirName);
const run = promisify(execFile);

const sites = [
  {
    id: 'neuralink',
    origin: 'https://neuralink.com',
    sitemaps: ['https://neuralink.com/sitemap.xml'],
    localPrefix: '/downloaded-sites/neuralink/neuralink.com',
    homeLocalPath: '/downloaded-sites/neuralink/neuralink.com/index.html',
  },
  {
    id: 'neuropixels',
    origin: 'https://www.neuropixels.org',
    sitemaps: [
      'https://www.neuropixels.org/pages-sitemap.xml',
      'https://www.neuropixels.org/blog-posts-sitemap.xml',
    ],
    localPrefix: '/downloaded-sites/neuropixels/www.neuropixels.org',
    homeLocalPath: '/downloaded-sites/neuropixels/www.neuropixels.org/index.html',
  },
];

const viewports = [
  { id: 'desktop', width: 1440, height: 1000 },
  { id: 'mobile', width: 390, height: 844 },
];

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
      const description = result.exceptionDetails.exception?.description
        || result.exceptionDetails.text
        || 'Runtime evaluation failed';
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
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'live-local-chrome-'));
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
  const exceptions = [];
  page.on('Network.requestWillBeSent', (params) => requests.push(params.request.url));
  page.on('Runtime.exceptionThrown', (params) => {
    const details = params.exceptionDetails || {};
    exceptions.push({
      text: details.text || '',
      description: details.exception?.description || '',
      value: details.exception?.value || '',
      url: details.url || '',
    });
  });
  await Promise.all([
    page.send('Page.enable'),
    page.send('Runtime.enable'),
    page.send('Network.enable'),
  ]);

  return {
    page,
    requests,
    exceptions,
    async cleanup() {
      page.close();
      chrome.kill('SIGTERM');
      await fs.rm(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      if (stderr && process.env.VERBOSE_CHROME) process.stderr.write(stderr);
    },
  };
};

const escapeMd = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');

const slugForUrl = (url) => {
  const parsed = new URL(url);
  const clean = parsed.pathname.replace(/^\/+|\/+$/g, '') || 'home';
  return clean
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'home';
};

const normalizePageUrl = (rawUrl, site, base = site.origin) => {
  let parsed;
  try {
    parsed = new URL(rawUrl, base);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return null;
  if (parsed.origin !== site.origin) return null;
  if (parsed.search || parsed.hash) return null;
  const ext = path.extname(parsed.pathname).toLowerCase();
  if (ext && !['.html', '.htm'].includes(ext)) return null;
  return parsed.href;
};

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 live-vs-local-public-research-verifier' },
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
};

const discoverLivePages = async () => {
  const pages = new Map();
  const errors = [];
  for (const site of sites) {
    for (const sitemap of site.sitemaps) {
      try {
        const xml = await fetchText(sitemap);
        for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
          const url = normalizePageUrl(match[1].trim(), site);
          if (url) pages.set(url, { site: site.id, url, slug: slugForUrl(url) });
        }
      } catch (error) {
        errors.push({ sitemap, error: error.message });
      }
    }
  }
  return {
    pages: [...pages.values()].sort((a, b) => `${a.site}:${a.url}`.localeCompare(`${b.site}:${b.url}`)),
    errors,
  };
};

const visibleSelectorScript = `
  function isVisible(element) {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none'
      && style.visibility !== 'hidden'
      && style.opacity !== '0'
      && rect.width > 2
      && rect.height > 2;
  }
`;

const extractRenderedMetrics = async (session, url, waitMs) => {
  const requestStart = session.requests.length;
  const exceptionStart = session.exceptions.length;
  await session.page.send('Page.navigate', { url });
  await delay(waitMs);
  const metrics = await session.page.evaluate(`(() => {
    ${visibleSelectorScript}
    const anchors = [...document.querySelectorAll('a[href]')];
    const controls = [...document.querySelectorAll('button,[role="button"],input[type="button"],input[type="submit"],input[type="reset"]')];
    const forms = [...document.querySelectorAll('form')];
    const inputs = [...document.querySelectorAll('input,textarea,select')];
    const visibleAnchors = anchors.filter(isVisible);
    const visibleControls = controls.filter(isVisible);
    const visibleImages = [...document.querySelectorAll('img')].filter(isVisible);
    const videos = [...document.querySelectorAll('video')].filter(isVisible);
    const linkHrefs = visibleAnchors.map((anchor) => {
      try {
        const url = new URL(anchor.href);
        return url.origin + url.pathname;
      } catch {
        return anchor.getAttribute('href') || '';
      }
    }).filter(Boolean).sort();
    return {
      title: document.title,
      href: location.href,
      bodyTextLength: document.body.innerText.length,
      bodyTextSample: document.body.innerText.replace(/\\s+/g, ' ').trim().slice(0, 300),
      h1: [...document.querySelectorAll('h1')].filter(isVisible).map((item) => item.innerText.trim()).filter(Boolean).slice(0, 10),
      visibleLinkCount: visibleAnchors.length,
      visibleControlCount: visibleControls.length,
      formCount: forms.length,
      inputCount: inputs.length,
      visibleImageCount: visibleImages.length,
      visibleVideoCount: videos.length,
      linkHrefSample: linkHrefs.slice(0, 20),
      uniqueVisibleHrefCount: new Set(linkHrefs).size,
    };
  })()`);
  return {
    ...metrics,
    requestCount: session.requests.length - requestStart,
    exceptionCount: session.exceptions.length - exceptionStart,
    exceptionSamples: session.exceptions.slice(exceptionStart, exceptionStart + 5),
  };
};

const compareMetricPair = (live, local) => {
  const checks = [];
  const add = (name, liveValue, localValue, pass) => checks.push({ name, live: liveValue, local: localValue, pass });
  const bodyDelta = local.bodyTextLength - live.bodyTextLength;
  const bodyRatio = live.bodyTextLength === 0 ? (local.bodyTextLength === 0 ? 1 : 0) : local.bodyTextLength / live.bodyTextLength;
  add('title exact', live.title, local.title, live.title === local.title);
  add('visible h1 exact', live.h1, local.h1, JSON.stringify(live.h1) === JSON.stringify(local.h1));
  add('body length within 5%', live.bodyTextLength, local.bodyTextLength, bodyRatio >= 0.95 && bodyRatio <= 1.05);
  add('visible links exact count', live.visibleLinkCount, local.visibleLinkCount, live.visibleLinkCount === local.visibleLinkCount);
  add('visible controls exact count', live.visibleControlCount, local.visibleControlCount, live.visibleControlCount === local.visibleControlCount);
  add('forms exact count', live.formCount, local.formCount, live.formCount === local.formCount);
  add('inputs exact count', live.inputCount, local.inputCount, live.inputCount === local.inputCount);
  add('visible images exact count', live.visibleImageCount, local.visibleImageCount, live.visibleImageCount === local.visibleImageCount);
  add('visible videos exact count', live.visibleVideoCount, local.visibleVideoCount, live.visibleVideoCount === local.visibleVideoCount);
  return {
    passed: checks.every((check) => check.pass),
    bodyDelta,
    checks,
  };
};

const localUrlForPage = (page) => `${baseUrl}/${page.downloaded_path}`;

const imageDimensions = async (file) => {
  const buffer = await fs.readFile(file);
  if (buffer.length < 24 || buffer[0] !== 0x89 || buffer[1] !== 0x50) return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
};

const psnr = async (reference, actual) => {
  const refDim = await imageDimensions(reference);
  const actualDim = await imageDimensions(actual);
  if (!refDim || !actualDim || refDim.width !== actualDim.width || refDim.height !== actualDim.height) {
    return {
      pass: false,
      psnr: 'dimension-mismatch',
      reference_dimensions: refDim,
      actual_dimensions: actualDim,
    };
  }
  try {
    const { stderr } = await run('ffmpeg', [
      '-hide_banner',
      '-nostats',
      '-i',
      reference,
      '-i',
      actual,
      '-lavfi',
      'psnr',
      '-f',
      'null',
      '-',
    ], { cwd: root, timeout: 60_000, maxBuffer: 2 * 1024 * 1024 });
    const match = stderr.match(/average:([^\s]+)/);
    const value = match ? match[1] : 'unknown';
    const numeric = Number(value);
    return {
      pass: value === 'inf' || (Number.isFinite(numeric) && numeric >= 35),
      psnr: value,
      reference_dimensions: refDim,
      actual_dimensions: actualDim,
    };
  } catch (error) {
    return {
      pass: false,
      psnr: `error:${error.message}`,
      reference_dimensions: refDim,
      actual_dimensions: actualDim,
    };
  }
};

const screenshot = async ({ url, output, viewport }) => {
  try {
    await run('npx', [
      '--yes',
      'playwright',
      'screenshot',
      '--full-page',
      '--ignore-https-errors',
      '--wait-for-timeout',
      '3500',
      '--viewport-size',
      `${viewport.width},${viewport.height}`,
      url,
      output,
    ], { cwd: root, timeout: 180_000, maxBuffer: 2 * 1024 * 1024 });
    return { pass: true };
  } catch (error) {
    return {
      pass: false,
      error: error.message,
      code: error.code ?? null,
      signal: error.signal ?? null,
    };
  }
};

const runVisualSmoke = async () => {
  await fs.mkdir(screenshotRoot, { recursive: true });
  const rows = [];
  for (const site of sites) {
    for (const viewport of viewports) {
      const live = path.join(screenshotRoot, `${site.id}-${viewport.id}-live.png`);
      const local = path.join(screenshotRoot, `${site.id}-${viewport.id}-local.png`);
      const liveCapture = await screenshot({ url: site.origin, output: live, viewport });
      const localCapture = await screenshot({ url: `${baseUrl}${site.homeLocalPath}`, output: local, viewport });
      if (!liveCapture.pass || !localCapture.pass) {
        rows.push({
          site: site.id,
          viewport: viewport.id,
          live_screenshot: path.relative(root, live),
          local_screenshot: path.relative(root, local),
          pass: false,
          psnr: 'capture-error',
          live_capture: liveCapture,
          local_capture: localCapture,
        });
        continue;
      }
      const score = await psnr(live, local);
      rows.push({
        site: site.id,
        viewport: viewport.id,
        live_screenshot: path.relative(root, live),
        local_screenshot: path.relative(root, local),
        ...score,
      });
    }
  }
  return rows;
};

const main = async () => {
  const inventory = JSON.parse(await fs.readFile(path.join(root, 'docs', 'reports', 'public-interaction-inventory.json'), 'utf8'));
  const manifestPages = inventory.pages.map((page) => ({
    site: page.site,
    slug: page.slug,
    url: page.url,
    downloaded_path: page.downloaded_path,
  }));

  const liveDiscovery = await discoverLivePages();
  const manifestUrlSet = new Set(manifestPages.map((page) => page.url));
  const liveUrlSet = new Set(liveDiscovery.pages.map((page) => page.url));
  const missingFromManifest = liveDiscovery.pages.filter((page) => !manifestUrlSet.has(page.url));
  const noLongerInLiveSitemap = manifestPages.filter((page) => !liveUrlSet.has(page.url));
  const missingLocalFiles = manifestPages.filter((page) => !existsSync(path.join(root, page.downloaded_path)));

  const session = await launchPage({ width: 1440, height: 1000 });
  const pageRows = [];
  try {
    for (const [index, page] of manifestPages.entries()) {
      console.log(`[${index + 1}/${manifestPages.length}] ${page.url}`);
      const waitMs = page.site === 'neuralink' ? 4200 : 5200;
      const liveMetrics = await extractRenderedMetrics(session, page.url, waitMs);
      const localMetrics = await extractRenderedMetrics(session, localUrlForPage(page), page.site === 'neuralink' ? 2400 : 1800);
      const comparison = compareMetricPair(liveMetrics, localMetrics);
      pageRows.push({
        site: page.site,
        slug: page.slug,
        live_url: page.url,
        local_url: localUrlForPage(page),
        strict_passed: comparison.passed,
        body_delta: comparison.bodyDelta,
        live: liveMetrics,
        local: localMetrics,
        failed_checks: comparison.checks.filter((check) => !check.pass),
      });
    }
  } finally {
    await session.cleanup();
  }

  const visualRows = await runVisualSmoke();
  const strictFailures = pageRows.filter((row) => !row.strict_passed);
  const summary = {
    generated_at: new Date().toISOString(),
    clone_base_url: baseUrl,
    clone_label: cloneLabel,
    strict_passed: strictFailures.length === 0
      && missingFromManifest.length === 0
      && noLongerInLiveSitemap.length === 0
      && missingLocalFiles.length === 0
      && visualRows.every((row) => row.pass),
    page_count: manifestPages.length,
    strict_dom_pass_count: pageRows.length - strictFailures.length,
    strict_dom_failure_count: strictFailures.length,
    live_sitemap_page_count: liveDiscovery.pages.length,
    missing_from_manifest_count: missingFromManifest.length,
    no_longer_in_live_sitemap_count: noLongerInLiveSitemap.length,
    missing_local_file_count: missingLocalFiles.length,
    visual_homepage_pass_count: visualRows.filter((row) => row.pass).length,
    visual_homepage_count: visualRows.length,
    live_discovery_errors: liveDiscovery.errors,
    missing_from_manifest: missingFromManifest,
    no_longer_in_live_sitemap: noLongerInLiveSitemap,
    missing_local_files: missingLocalFiles,
    visual_homepage_rows: visualRows,
    page_rows: pageRows,
  };

  await fs.mkdir(path.dirname(reportJson), { recursive: true });
  await fs.writeFile(reportJson, `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(reportMd, `# Live vs Local Site Report

Generated: ${summary.generated_at}

Strict overall: ${summary.strict_passed ? 'PASS' : 'FAIL'}

Clone target: ${cloneLabel}

This report compares the current live public websites against the downloaded mirror target above. It is intentionally strict: title, visible H1s, body length tolerance, visible link/control/form/input/image/video counts, current sitemap coverage, local file presence, and homepage screenshot PSNR are all evaluated.

## Summary

- Manifest pages: ${summary.page_count}
- Live sitemap pages: ${summary.live_sitemap_page_count}
- Strict DOM pass: ${summary.strict_dom_pass_count}/${summary.page_count}
- Strict DOM failures: ${summary.strict_dom_failure_count}
- Missing from manifest: ${summary.missing_from_manifest_count}
- No longer in live sitemap: ${summary.no_longer_in_live_sitemap_count}
- Missing local files: ${summary.missing_local_file_count}
- Homepage visual pass: ${summary.visual_homepage_pass_count}/${summary.visual_homepage_count}

## Homepage Visual Rows

| Site | Viewport | Pass | PSNR | Live | Local |
| --- | --- | --- | --- | --- | --- |
${visualRows.map((row) => `| ${row.site} | ${row.viewport} | ${row.pass ? 'PASS' : 'FAIL'} | ${row.psnr} | ${row.live_screenshot} | ${row.local_screenshot} |`).join('\n')}

## Strict DOM Failures

| Site | Slug | Failed Checks |
| --- | --- | --- |
${strictFailures.slice(0, 120).map((row) => `| ${row.site} | ${row.slug} | ${escapeMd(row.failed_checks.map((check) => `${check.name}: live=${JSON.stringify(check.live)} local=${JSON.stringify(check.local)}`).join('; '))} |`).join('\n') || '| none | none | none |'}

## Sitemap Deltas

### Missing From Manifest

${missingFromManifest.map((page) => `- ${page.site}: ${page.url}`).join('\n') || '- none'}

### In Manifest But Not Current Live Sitemap

${noLongerInLiveSitemap.map((page) => `- ${page.site}: ${page.url}`).join('\n') || '- none'}
`);

  console.log(JSON.stringify({
    strict_passed: summary.strict_passed,
    clone_base_url: summary.clone_base_url,
    page_count: summary.page_count,
    strict_dom_pass_count: summary.strict_dom_pass_count,
    strict_dom_failure_count: summary.strict_dom_failure_count,
    missing_from_manifest_count: summary.missing_from_manifest_count,
    no_longer_in_live_sitemap_count: summary.no_longer_in_live_sitemap_count,
    missing_local_file_count: summary.missing_local_file_count,
    visual_homepage_pass_count: summary.visual_homepage_pass_count,
    visual_homepage_count: summary.visual_homepage_count,
  }, null, 2));

  if (!summary.strict_passed) process.exit(1);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
