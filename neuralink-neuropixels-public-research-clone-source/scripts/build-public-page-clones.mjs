import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const root = process.cwd();
const outRoot = path.join(root, 'public-clone');
const run = promisify(execFile);
const sites = [
  {
    id: 'neuralink',
    origin: 'https://neuralink.com',
    sitemaps: ['https://neuralink.com/sitemap.xml']
  },
  {
    id: 'neuropixels',
    origin: 'https://www.neuropixels.org',
    sitemaps: [
      'https://www.neuropixels.org/pages-sitemap.xml',
      'https://www.neuropixels.org/blog-posts-sitemap.xml'
    ]
  }
];

const viewports = [
  { id: 'desktop', width: 1440, height: 1000 },
  { id: 'mobile', width: 390, height: 844 }
];

const waitMs = Number(process.env.CLONE_WAIT_MS || 3500);
const maxPages = Number(process.env.CLONE_MAX_PAGES || 0);
const pageExtensions = new Set(['', '.html', '.htm']);
const documentExtensions = new Set(['.pdf']);

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);

const slugForUrl = (url) => {
  const parsed = new URL(url);
  const clean = parsed.pathname.replace(/^\/+|\/+$/g, '') || 'home';
  return clean
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'home';
};

const pageHref = (siteId, slug) => `sites/${siteId}/${slug}/index.html`;

function urlExtension(url) {
  const parsed = new URL(url);
  const ext = path.extname(parsed.pathname).toLowerCase();
  return ext;
}

function isRobotsExcluded(site, parsed) {
  if (site.id !== 'neuropixels') return false;
  const pathAndSearch = `${parsed.pathname}${parsed.search}`;
  return parsed.search.includes('lightbox=')
    || pathAndSearch.includes('_partials')
    || pathAndSearch.includes('pro-gallery');
}

function normalizePublicUrl(rawUrl, site, baseUrl = site.origin) {
  let parsed;
  try {
    parsed = new URL(rawUrl, baseUrl);
  } catch {
    return null;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) return null;
  if (parsed.origin !== site.origin) return null;
  if (isRobotsExcluded(site, parsed)) return null;
  if (parsed.search) return null;
  parsed.hash = '';

  const ext = path.extname(parsed.pathname).toLowerCase();
  if (documentExtensions.has(ext)) return { kind: 'document', url: parsed.href };
  if (!pageExtensions.has(ext)) return null;
  return { kind: 'page', url: parsed.href };
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}

async function discoverUrls() {
  const manifest = new Map();
  const documents = new Map();

  for (const site of sites) {
    const queue = [];
    const rejected = new Set();
    for (const sitemap of site.sitemaps) {
      const xml = await fetchText(sitemap);
      for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
        const normalized = normalizePublicUrl(match[1].trim(), site);
        if (!normalized) continue;
        if (normalized.kind === 'document') {
          documents.set(normalized.url, {
            site: site.id,
            url: normalized.url,
            type: urlExtension(normalized.url).slice(1),
            slug: slugForUrl(normalized.url)
          });
          continue;
        }
        if (!rejected.has(normalized.url) && !manifest.has(normalized.url)) {
          manifest.set(normalized.url, {
            site: site.id,
            origin: site.origin,
            url: normalized.url,
            slug: slugForUrl(normalized.url)
          });
          queue.push(normalized.url);
        }
      }
    }

    for (let index = 0; index < queue.length; index += 1) {
      const url = queue[index];
      let html;
      try {
        html = await fetchText(url);
      } catch (error) {
        manifest.delete(url);
        rejected.add(url);
        console.warn(`Discovery removed ${url}: ${error.message}`);
        continue;
      }
      for (const match of html.matchAll(/<a\b[^>]*\bhref=(["'])(.*?)\1/gi)) {
        const normalized = normalizePublicUrl(match[2], site, url);
        if (!normalized) continue;
        if (normalized.kind === 'document') {
          documents.set(normalized.url, {
            site: site.id,
            url: normalized.url,
            type: urlExtension(normalized.url).slice(1),
            slug: slugForUrl(normalized.url)
          });
          continue;
        }
        if (!rejected.has(normalized.url) && !manifest.has(normalized.url)) {
          manifest.set(normalized.url, {
            site: site.id,
            origin: site.origin,
            url: normalized.url,
            slug: slugForUrl(normalized.url)
          });
          queue.push(normalized.url);
        }
      }
    }
  }

  const pages = [...manifest.values()].sort((a, b) => `${a.site}:${a.url}`.localeCompare(`${b.site}:${b.url}`));
  return {
    pages: maxPages > 0 ? pages.slice(0, maxPages) : pages,
    documents: [...documents.values()].sort((a, b) => `${a.site}:${a.url}`.localeCompare(`${b.site}:${b.url}`))
  };
}

async function titleForUrl(url) {
  try {
    const html = await fetchText(url);
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1].trim().replace(/\s+/g, ' ') : url;
  } catch {
    return url;
  }
}

async function pngDimensions(file) {
  const buffer = await readFile(file);
  const isPng = buffer.length >= 24
    && buffer[0] === 0x89
    && buffer[1] === 0x50
    && buffer[2] === 0x4e
    && buffer[3] === 0x47;
  if (!isPng) return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

async function captureScreenshot(pageItem, viewport, output) {
  const baseArgs = [
    '--yes',
    'playwright',
    'screenshot',
    '--full-page',
    '--ignore-https-errors',
    '--wait-for-timeout'
  ];

  const runCapture = (settleMs) => run('npx', [
    ...baseArgs,
    String(settleMs),
    '--viewport-size',
    `${viewport.width},${viewport.height}`,
    pageItem.url,
    output
  ], {
    cwd: root,
    timeout: 90000,
    maxBuffer: 1024 * 1024 * 2
  });

  try {
    await runCapture(waitMs);
  } catch (error) {
    await runCapture(waitMs * 2);
  }
}

async function capturePage(pageItem, allPages) {
  const pageDir = path.join(outRoot, 'sites', pageItem.site, pageItem.slug);
  const assetDir = path.join(pageDir, 'assets');
  await mkdir(assetDir, { recursive: true });

  const captures = {};
  let title = await titleForUrl(pageItem.url);
  let error = null;

  try {
    for (const viewport of viewports) {
      const output = path.join(assetDir, `${viewport.id}.png`);
      await captureScreenshot(pageItem, viewport, output);
      const dimensions = await pngDimensions(output);
      captures[viewport.id] = {
        viewport: `${viewport.width}x${viewport.height}`,
        screenshot: `assets/${viewport.id}.png`,
        ...dimensions
      };
    }
  } catch (captureError) {
    error = captureError.message;
  }

  await writePageHtml(pageDir, {
    ...pageItem,
    title,
    captures,
    allPages,
    error
  });

  return { ...pageItem, title, captures, error };
}

async function writePageHtml(pageDir, data) {
  const desktopWidth = data.captures.desktop?.width ? `${data.captures.desktop.width}px` : '100%';
  const mobileWidth = data.captures.mobile?.width ? `${data.captures.mobile.width}px` : desktopWidth;
  const navLinks = data.allPages
    .filter((page) => page.site === data.site)
    .map((page) => {
      const href = path.relative(pageDir, path.join(outRoot, pageHref(page.site, page.slug))) || 'index.html';
      return `        <li><a href="${escapeHtml(href)}">${escapeHtml(page.url)}</a></li>`;
    })
    .join('\n');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(data.title)}</title>
    <link rel="stylesheet" href="../../../styles/public-clone.css">
  </head>
  <body>
    <main class="page-shot" style="--desktop-shot-width:${desktopWidth};--mobile-shot-width:${mobileWidth}" aria-label="${escapeHtml(data.title)}">
      <picture>
        <source media="(max-width: 700px)" srcset="assets/mobile.png">
        <img src="assets/desktop.png" alt="${escapeHtml(data.title)} screenshot">
      </picture>
      <nav class="visually-hidden" aria-label="Public clone pages">
        <ol>
${navLinks}
        </ol>
      </nav>
    </main>
  </body>
</html>
`;
  await writeFile(path.join(pageDir, 'index.html'), html);
}

async function writeIndex(results, documents) {
  const grouped = results.reduce((acc, page) => {
    acc[page.site] ||= [];
    acc[page.site].push(page);
    return acc;
  }, {});

  const sections = Object.entries(grouped).map(([site, pages]) => `
      <section>
        <h2>${escapeHtml(site)}</h2>
        <ol>
${pages.map((page) => `          <li><a href="${escapeHtml(pageHref(page.site, page.slug))}">${escapeHtml(page.title || page.url)}</a><small>${escapeHtml(page.url)}${page.error ? ` — ERROR: ${escapeHtml(page.error)}` : ''}</small></li>`).join('\n')}
        </ol>
      </section>`).join('\n');

  const documentList = documents.map((doc) =>
    `          <li><a href="${escapeHtml(doc.url)}">${escapeHtml(doc.url)}</a> <small>public document linked, not backend-cloned</small></li>`
  ).join('\n');

  await writeFile(path.join(outRoot, 'index.html'), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Public research clones</title>
    <link rel="stylesheet" href="styles/public-clone.css">
  </head>
  <body class="index">
    <main>
      <h1>Public research clones</h1>
      <p>Screenshot-level local visual clones of publicly listed pages. Private data, authentication, and backend systems are not copied.</p>
${sections}
      <section>
        <h2>Public documents</h2>
        <ol>
${documentList || '          <li>No public documents discovered.</li>'}
        </ol>
      </section>
    </main>
  </body>
</html>
`);
}

async function writeCss() {
  await mkdir(path.join(outRoot, 'styles'), { recursive: true });
  await writeFile(path.join(outRoot, 'styles', 'public-clone.css'), `*{box-sizing:border-box}body{margin:0;background:#fff;font-family:Arial,Helvetica,sans-serif}.page-shot{position:relative;width:var(--desktop-shot-width,100%);min-width:320px}.page-shot img{display:block;width:var(--desktop-shot-width,100%);height:auto;max-width:none}.mobile-sliced-shot{display:none}.mobile-sliced-shot img{display:block}.hotspot{position:absolute;display:block;overflow:hidden;color:transparent;text-decoration:none;background:transparent}.hotspot:focus-visible{outline:2px solid #1d4ed8;outline-offset:2px}.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:700px){.page-shot{width:var(--mobile-shot-width,var(--desktop-shot-width,100%))}.page-shot img{width:var(--mobile-shot-width,var(--desktop-shot-width,100%))}.mobile-sliced-source{display:none}.mobile-sliced-shot{display:block}}.index{background:#f6f6f3;color:#111}.index main{max-width:980px;margin:0 auto;padding:40px 24px}.index h1{font-size:36px;margin:0 0 12px}.index h2{margin-top:36px}.index ol{display:grid;gap:10px;padding-left:22px}.index li small{display:block;color:#666;margin-top:3px;word-break:break-all}.index a{color:#111}`);
}

async function main() {
  await mkdir(outRoot, { recursive: true });
  await writeCss();
  const discovery = await discoverUrls();
  const pagesByUrl = new Map();
  for (const page of discovery.pages) {
    pagesByUrl.set(page.url.replace(/\/$/, ''), page);
    pagesByUrl.set(page.url.endsWith('/') ? page.url : `${page.url}/`, page);
  }

  const results = [];
  for (const [index, page] of discovery.pages.entries()) {
    console.log(`[${index + 1}/${discovery.pages.length}] ${page.url}`);
    results.push(await capturePage(page, discovery.pages));
  }

  await writeIndex(results, discovery.documents);
  await writeFile(path.join(outRoot, 'manifest.json'), JSON.stringify({
    generated_at: new Date().toISOString(),
    page_count: results.length,
    document_count: discovery.documents.length,
    pages: results,
    documents: discovery.documents
  }, null, 2));

  if (results.some((page) => page.error)) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
