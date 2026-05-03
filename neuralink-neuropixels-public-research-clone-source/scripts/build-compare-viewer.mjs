import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const manifest = JSON.parse(await readFile(path.join(root, 'public-clone', 'manifest.json'), 'utf8'));
const comparison = JSON.parse(await readFile(path.join(root, 'docs', 'reports', 'public-clone-visual-comparison.json'), 'utf8'));

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);

const rowsByKey = new Map(comparison.rows.map((row) => [`${row.url}:${row.viewport}`, row]));
const pages = manifest.pages.map((page) => ({
  site: page.site,
  title: page.title,
  url: page.url,
  slug: page.slug,
  clone: `sites/${page.site}/${page.slug}/index.html`,
  raw: {
    desktop: `sites/${page.site}/${page.slug}/assets/desktop.png`,
    mobile: `sites/${page.site}/${page.slug}/assets/mobile.png`
  },
  captures: page.captures,
  metrics: {
    desktop: rowsByKey.get(`${page.url}:desktop`),
    mobile: rowsByKey.get(`${page.url}:mobile`)
  }
}));

await writeFile(path.join(root, 'public-clone', 'compare.html'), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Raw vs Ours Comparison</title>
    <style>
      *{box-sizing:border-box}
      body{margin:0;background:#101114;color:#f5f5f2;font-family:Arial,Helvetica,sans-serif}
      header{position:sticky;top:0;z-index:5;display:grid;grid-template-columns:minmax(220px,1fr) auto auto;gap:12px;align-items:center;padding:12px 16px;background:#181a1f;border-bottom:1px solid #30333a}
      select,button{height:36px;border:1px solid #4a4f59;background:#23262d;color:#f5f5f2;border-radius:6px;padding:0 10px;font:inherit}
      button[aria-pressed="true"]{background:#f5f5f2;color:#111}
      .meta{display:flex;gap:12px;align-items:center;min-width:0;font-size:13px;color:#c9ccd3}
      .meta a{color:#c9ccd3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      main{display:grid;grid-template-columns:1fr 1fr;height:calc(100vh - 61px)}
      section{min-width:0;overflow:auto;border-right:1px solid #30333a;background:#fff}
      section:last-child{border-right:0}
      .label{position:sticky;top:0;z-index:2;padding:8px 12px;background:#181a1f;color:#f5f5f2;border-bottom:1px solid #30333a;font-size:13px}
      img{display:block;max-width:none}
      iframe{display:block;border:0;background:#fff}
      .raw-pane img{width:auto;height:auto}
      .ours-pane iframe{width:100%;height:100%}
      @media(max-width:900px){
        header{grid-template-columns:1fr}
        main{grid-template-columns:1fr;height:auto}
        section{height:70vh;border-right:0;border-bottom:1px solid #30333a}
      }
    </style>
  </head>
  <body>
    <header>
      <select id="pageSelect" aria-label="Page">
${pages.map((page, index) => `        <option value="${index}">${escapeHtml(page.site)} - ${escapeHtml(page.title || page.url)}</option>`).join('\n')}
      </select>
      <div>
        <button id="desktopBtn" type="button" aria-pressed="true">Desktop</button>
        <button id="mobileBtn" type="button" aria-pressed="false">Mobile</button>
      </div>
      <div class="meta">
        <span id="metric"></span>
        <a id="sourceUrl" href="#" target="_blank" rel="noreferrer"></a>
      </div>
    </header>
    <main>
      <section class="raw-pane">
        <div class="label">RAW source screenshot</div>
        <img id="rawImage" alt="Raw source screenshot">
      </section>
      <section class="ours-pane">
        <div class="label">OURS local clone page</div>
        <iframe id="cloneFrame" title="Local clone page"></iframe>
      </section>
    </main>
    <script>
      const pages = ${JSON.stringify(pages)};
      let viewport = 'desktop';
      const pageSelect = document.getElementById('pageSelect');
      const rawImage = document.getElementById('rawImage');
      const cloneFrame = document.getElementById('cloneFrame');
      const metric = document.getElementById('metric');
      const sourceUrl = document.getElementById('sourceUrl');
      const desktopBtn = document.getElementById('desktopBtn');
      const mobileBtn = document.getElementById('mobileBtn');

      function update() {
        const page = pages[Number(pageSelect.value)];
        const capture = page.captures[viewport];
        const row = page.metrics[viewport];
        rawImage.src = page.raw[viewport];
        rawImage.style.width = capture && capture.width ? capture.width + 'px' : 'auto';
        cloneFrame.src = page.clone;
        cloneFrame.style.width = capture && capture.width ? capture.width + 'px' : '100%';
        sourceUrl.href = page.url;
        sourceUrl.textContent = page.url;
        metric.textContent = viewport + ' | ' + (capture ? capture.width + 'x' + capture.height : '') + ' | PSNR ' + (row ? row.psnr : 'n/a') + ' | ' + (row && row.exact ? 'exact' : 'pass');
        desktopBtn.setAttribute('aria-pressed', viewport === 'desktop');
        mobileBtn.setAttribute('aria-pressed', viewport === 'mobile');
      }

      pageSelect.addEventListener('change', update);
      desktopBtn.addEventListener('click', () => { viewport = 'desktop'; update(); });
      mobileBtn.addEventListener('click', () => { viewport = 'mobile'; update(); });
      update();
    </script>
  </body>
</html>
`);

console.log(`wrote compare viewer for ${pages.length} pages`);
