import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outRoot = path.join(root, 'public-clone');
const rawRoot = path.join(outRoot, 'raw-html');
const manifest = JSON.parse(await readFile(path.join(outRoot, 'manifest.json'), 'utf8'));

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);

function rawPagePath(page, file = 'index.html') {
  return path.join(rawRoot, 'sites', page.site, page.slug, file);
}

function viewerHref(page, file = 'index.html') {
  return `raw-html/sites/${page.site}/${page.slug}/${file}`;
}

function cloneHref(page) {
  return `sites/${page.site}/${page.slug}/index.html`;
}

function injectBase(html, url) {
  const base = `<base href="${escapeHtml(url)}">`;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>\n    ${base}`);
  }
  return `<!doctype html><html><head>${base}</head><body>${html}</body></html>`;
}

async function fetchRawHtml(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 public research raw-html verifier'
    }
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}

const results = [];

for (const [index, page] of manifest.pages.entries()) {
  console.log(`[${index + 1}/${manifest.pages.length}] ${page.url}`);
  const dir = path.dirname(rawPagePath(page));
  await mkdir(dir, { recursive: true });
  let status = 'ok';
  let error = null;
  try {
    const sourceHtml = await fetchRawHtml(page.url);
    await writeFile(rawPagePath(page, 'source.html'), sourceHtml);
    await writeFile(rawPagePath(page, 'source.txt'), sourceHtml);
    await writeFile(rawPagePath(page, 'index.html'), injectBase(sourceHtml, page.url));
  } catch (fetchError) {
    status = 'error';
    error = fetchError.message;
    await writeFile(rawPagePath(page, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Raw HTML fetch failed</title><pre>${escapeHtml(error)}</pre>`);
    await writeFile(rawPagePath(page, 'source.txt'), error);
  }
  results.push({
    site: page.site,
    slug: page.slug,
    title: page.title,
    url: page.url,
    raw_html: viewerHref(page, 'index.html'),
    raw_source: viewerHref(page, 'source.txt'),
    ours_html: cloneHref(page),
    status,
    error
  });
}

await writeFile(path.join(rawRoot, 'manifest.json'), JSON.stringify({
  generated_at: new Date().toISOString(),
  page_count: results.length,
  error_count: results.filter((result) => result.status !== 'ok').length,
  pages: results
}, null, 2));

await writeFile(path.join(outRoot, 'html-compare.html'), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Raw HTML Source vs Ours</title>
    <style>
      *{box-sizing:border-box}
      body{margin:0;background:#111318;color:#f5f5f2;font-family:Arial,Helvetica,sans-serif}
      header{position:sticky;top:0;z-index:10;display:grid;grid-template-columns:minmax(280px,1fr) auto auto;gap:10px;align-items:center;padding:10px 12px;background:#1b1e25;border-bottom:1px solid #343945}
      select,button{height:36px;border:1px solid #4a5160;background:#252a33;color:#f5f5f2;border-radius:6px;padding:0 10px;font:inherit}
      button[aria-pressed="true"]{background:#f5f5f2;color:#111318}
      a{color:#d7dbff}
      .meta{min-width:0;display:flex;gap:10px;align-items:center;font-size:13px;color:#c8ccd5}
      .meta a{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      main{display:grid;grid-template-columns:1fr 1fr;height:calc(100vh - 57px)}
      section{min-width:0;display:grid;grid-template-rows:auto 1fr;border-right:1px solid #343945;background:#fff}
      section:last-child{border-right:0}
      .label{display:flex;gap:10px;align-items:center;padding:8px 10px;background:#1b1e25;color:#f5f5f2;border-bottom:1px solid #343945;font-size:13px}
      iframe{width:100%;height:100%;border:0;background:#fff}
      pre{margin:0;height:100%;overflow:auto;padding:14px;background:#0b0d11;color:#e6e6df;font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre-wrap;word-break:break-word}
      @media(max-width:900px){header{grid-template-columns:1fr}main{grid-template-columns:1fr;height:auto}section{height:72vh;border-right:0;border-bottom:1px solid #343945}}
    </style>
  </head>
  <body>
    <header>
      <select id="pageSelect" aria-label="Page">
${results.map((page, index) => `        <option value="${index}">${escapeHtml(page.site)} - ${escapeHtml(page.title || page.url)}</option>`).join('\n')}
      </select>
      <div>
        <button id="sourceBtn" type="button" aria-pressed="true">Source Text</button>
        <button id="renderBtn" type="button" aria-pressed="false">Rendered HTML</button>
      </div>
      <div class="meta">
        <span id="status"></span>
        <a id="sourceUrl" href="#" target="_blank" rel="noreferrer"></a>
      </div>
    </header>
    <main>
      <section>
        <div class="label">
          <strong>RAW original public HTML source</strong>
          <a id="rawOpen" href="#" target="_blank">open raw source</a>
        </div>
        <pre id="rawSource"></pre>
        <iframe id="rawFrame" title="Raw original public HTML rendered" hidden></iframe>
      </section>
      <section>
        <div class="label">
          <strong>OURS local HTML source</strong>
          <a id="oursOpen" href="#" target="_blank">open ours html</a>
        </div>
        <pre id="oursSource"></pre>
        <iframe id="oursFrame" title="Ours local HTML rendered" hidden></iframe>
      </section>
    </main>
    <script>
      const pages = ${JSON.stringify(results)};
      let mode = 'source';
      const pageSelect = document.getElementById('pageSelect');
      const rawFrame = document.getElementById('rawFrame');
      const rawSource = document.getElementById('rawSource');
      const oursSource = document.getElementById('oursSource');
      const oursFrame = document.getElementById('oursFrame');
      const rawOpen = document.getElementById('rawOpen');
      const oursOpen = document.getElementById('oursOpen');
      const sourceUrl = document.getElementById('sourceUrl');
      const status = document.getElementById('status');
      const renderBtn = document.getElementById('renderBtn');
      const sourceBtn = document.getElementById('sourceBtn');

      async function update() {
        const page = pages[Number(pageSelect.value)];
        rawOpen.href = page.raw_source;
        oursOpen.href = page.ours_html;
        sourceUrl.href = page.url;
        sourceUrl.textContent = page.url;
        status.textContent = page.status === 'ok' ? 'raw html fetched' : 'raw html error';
        if (mode === 'source') {
          rawFrame.hidden = true;
          oursFrame.hidden = true;
          rawSource.hidden = false;
          oursSource.hidden = false;
          const [rawResponse, oursResponse] = await Promise.all([
            fetch(page.raw_source),
            fetch(page.ours_html)
          ]);
          rawSource.textContent = await rawResponse.text();
          oursSource.textContent = await oursResponse.text();
        } else {
          rawSource.hidden = true;
          oursSource.hidden = true;
          rawFrame.hidden = false;
          oursFrame.hidden = false;
          rawFrame.src = page.raw_html;
          oursFrame.src = page.ours_html;
        }

        renderBtn.setAttribute('aria-pressed', mode === 'render');
        sourceBtn.setAttribute('aria-pressed', mode === 'source');
      }

      pageSelect.addEventListener('change', update);
      renderBtn.addEventListener('click', () => { mode = 'render'; update(); });
      sourceBtn.addEventListener('click', () => { mode = 'source'; update(); });
      update();
    </script>
  </body>
</html>
`);

const standalonePages = [];
for (const page of results) {
  const rawSource = await readFile(path.join(outRoot, page.raw_source), 'utf8');
  const oursSource = await readFile(path.join(outRoot, page.ours_html), 'utf8');
  standalonePages.push({
    site: page.site,
    title: page.title,
    url: page.url,
    status: page.status,
    rawSource,
    oursSource
  });
}

const safeStandaloneJson = JSON.stringify(standalonePages)
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e')
  .replace(/&/g, '\\u0026');

await writeFile(path.join(outRoot, 'html-source-compare-standalone.html'), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Standalone Raw HTML Source vs Ours</title>
    <style>
      *{box-sizing:border-box}
      body{margin:0;background:#111318;color:#f5f5f2;font-family:Arial,Helvetica,sans-serif}
      header{position:sticky;top:0;z-index:10;display:grid;grid-template-columns:minmax(280px,1fr) auto;gap:10px;align-items:center;padding:10px 12px;background:#1b1e25;border-bottom:1px solid #343945}
      select{height:36px;border:1px solid #4a5160;background:#252a33;color:#f5f5f2;border-radius:6px;padding:0 10px;font:inherit}
      a{color:#d7dbff}
      main{display:grid;grid-template-columns:1fr 1fr;height:calc(100vh - 57px)}
      section{min-width:0;display:grid;grid-template-rows:auto 1fr;border-right:1px solid #343945}
      section:last-child{border-right:0}
      .label{padding:8px 10px;background:#1b1e25;color:#f5f5f2;border-bottom:1px solid #343945;font-size:13px}
      pre{margin:0;height:100%;overflow:auto;padding:14px;background:#0b0d11;color:#e6e6df;font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre-wrap;word-break:break-word}
      @media(max-width:900px){header{grid-template-columns:1fr}main{grid-template-columns:1fr;height:auto}section{height:72vh;border-right:0;border-bottom:1px solid #343945}}
    </style>
  </head>
  <body>
    <header>
      <select id="pageSelect" aria-label="Page"></select>
      <a id="sourceUrl" href="#" target="_blank" rel="noreferrer"></a>
    </header>
    <main>
      <section>
        <div class="label"><strong>RAW original public HTML source</strong></div>
        <pre id="rawSource"></pre>
      </section>
      <section>
        <div class="label"><strong>OURS local HTML source</strong></div>
        <pre id="oursSource"></pre>
      </section>
    </main>
    <script id="pagesData" type="application/json">${safeStandaloneJson}</script>
    <script>
      const pages = JSON.parse(document.getElementById('pagesData').textContent);
      const pageSelect = document.getElementById('pageSelect');
      const rawSource = document.getElementById('rawSource');
      const oursSource = document.getElementById('oursSource');
      const sourceUrl = document.getElementById('sourceUrl');
      for (const [index, page] of pages.entries()) {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = page.site + ' - ' + (page.title || page.url);
        pageSelect.appendChild(option);
      }
      function update() {
        const page = pages[Number(pageSelect.value)];
        rawSource.textContent = page.rawSource;
        oursSource.textContent = page.oursSource;
        sourceUrl.href = page.url;
        sourceUrl.textContent = page.url;
      }
      pageSelect.addEventListener('change', update);
      update();
    </script>
  </body>
</html>
`);

console.log(`wrote raw HTML comparison for ${results.length} pages`);
console.log(`errors=${results.filter((result) => result.status !== 'ok').length}`);
