import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outRoot = path.join(root, 'public-clone');
const manifest = JSON.parse(await readFile(path.join(outRoot, 'manifest.json'), 'utf8'));

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);

const pages = manifest.pages.map((page) => ({
  site: page.site,
  title: page.title,
  url: page.url,
  ours: `sites/${page.site}/${page.slug}/index.html`
}));

await writeFile(path.join(outRoot, 'live-page-compare.html'), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Original Page vs Ours Page</title>
    <style>
      *{box-sizing:border-box}
      body{margin:0;background:#111318;color:#f5f5f2;font-family:Arial,Helvetica,sans-serif}
      header{position:sticky;top:0;z-index:10;display:grid;grid-template-columns:minmax(260px,1fr) auto auto;gap:10px;align-items:center;padding:10px 12px;background:#1b1e25;border-bottom:1px solid #343945}
      select,button,a.button{height:36px;border:1px solid #4a5160;background:#252a33;color:#f5f5f2;border-radius:6px;padding:0 10px;font:inherit;text-decoration:none;display:inline-flex;align-items:center}
      button{cursor:pointer}
      .links{display:flex;gap:8px;align-items:center;white-space:nowrap}
      main{display:grid;grid-template-columns:1fr 1fr;height:calc(100vh - 57px)}
      section{min-width:0;display:grid;grid-template-rows:auto 1fr;border-right:1px solid #343945;background:#fff}
      section:last-child{border-right:0}
      .label{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:8px 10px;background:#1b1e25;color:#f5f5f2;border-bottom:1px solid #343945;font-size:13px}
      iframe{width:100%;height:100%;border:0;background:#fff}
      .notice{display:none;padding:10px;background:#fff3cd;color:#3b2e00;border-bottom:1px solid #e7c76a;font-size:13px}
      @media(max-width:900px){header{grid-template-columns:1fr}.links{flex-wrap:wrap}main{grid-template-columns:1fr;height:auto}section{height:72vh;border-right:0;border-bottom:1px solid #343945}}
    </style>
  </head>
  <body>
    <header>
      <select id="pageSelect" aria-label="Page">
${pages.map((page, index) => `        <option value="${index}">${escapeHtml(page.site)} - ${escapeHtml(page.title || page.url)}</option>`).join('\n')}
      </select>
      <button id="reloadBtn" type="button">Reload Both</button>
      <div class="links">
        <a id="openOriginal" class="button" href="#" target="_blank" rel="noreferrer">Open Original</a>
        <a id="openOurs" class="button" href="#" target="_blank">Open Ours</a>
      </div>
    </header>
    <main>
      <section>
        <div class="label">
          <strong>ORIGINAL LIVE PAGE</strong>
          <span id="originalUrl"></span>
        </div>
        <div class="notice">If this pane is blank, the original site is blocking iframe embedding. Use "Open Original" above.</div>
        <iframe id="originalFrame" title="Original live page"></iframe>
      </section>
      <section>
        <div class="label">
          <strong>OURS LOCAL HTML PAGE</strong>
          <span id="oursUrl"></span>
        </div>
        <iframe id="oursFrame" title="Ours local HTML page"></iframe>
      </section>
    </main>
    <script>
      const pages = ${JSON.stringify(pages)};
      const pageSelect = document.getElementById('pageSelect');
      const originalFrame = document.getElementById('originalFrame');
      const oursFrame = document.getElementById('oursFrame');
      const openOriginal = document.getElementById('openOriginal');
      const openOurs = document.getElementById('openOurs');
      const originalUrl = document.getElementById('originalUrl');
      const oursUrl = document.getElementById('oursUrl');
      const reloadBtn = document.getElementById('reloadBtn');

      function update() {
        const page = pages[Number(pageSelect.value)];
        originalFrame.src = page.url;
        oursFrame.src = page.ours;
        openOriginal.href = page.url;
        openOurs.href = page.ours;
        originalUrl.textContent = page.url;
        oursUrl.textContent = page.ours;
      }

      pageSelect.addEventListener('change', update);
      reloadBtn.addEventListener('click', update);
      update();
    </script>
  </body>
</html>
`);

console.log(`wrote live page comparison for ${pages.length} pages`);
