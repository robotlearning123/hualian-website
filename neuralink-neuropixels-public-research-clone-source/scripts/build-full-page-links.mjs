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

const rows = manifest.pages.map((page) => ({
  site: page.site,
  title: page.title,
  original: page.url,
  ours: `sites/${page.site}/${page.slug}/index.html`
}));

await writeFile(path.join(outRoot, 'full-page-links.html'), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Open Original and Ours Full Pages</title>
    <style>
      *{box-sizing:border-box}
      body{margin:0;background:#f4f4f0;color:#111;font-family:Arial,Helvetica,sans-serif}
      header{position:sticky;top:0;z-index:10;padding:16px 20px;background:#111;color:#fff}
      h1{font-size:20px;margin:0 0 6px}
      p{margin:0;color:#cfcfcf}
      main{padding:18px 20px}
      table{width:100%;border-collapse:collapse;background:#fff}
      th,td{border-bottom:1px solid #ddd;padding:10px;text-align:left;vertical-align:top;font-size:14px}
      th{position:sticky;top:74px;background:#e9e9e4;z-index:5}
      a,button{display:inline-flex;align-items:center;min-height:32px;margin:2px 4px 2px 0;padding:6px 10px;border:1px solid #222;border-radius:4px;background:#fff;color:#111;text-decoration:none;font:inherit;cursor:pointer}
      button{background:#111;color:#fff}
      .url{word-break:break-all;color:#555;font-size:12px;margin-top:4px}
      .site{font-weight:700;text-transform:uppercase;font-size:12px;color:#555}
      @media(max-width:900px){table,thead,tbody,tr,th,td{display:block}thead{display:none}tr{border:1px solid #ddd;margin-bottom:12px;background:#fff}td{border-bottom:0}}
    </style>
  </head>
  <body>
    <header>
      <h1>Original Full Page vs Ours Full Page</h1>
      <p>No screenshots. No source-code view. These links open the rendered HTML pages directly.</p>
    </header>
    <main>
      <table>
        <thead>
          <tr>
            <th>Page</th>
            <th>Open Full Pages</th>
            <th>Original URL</th>
            <th>Ours URL</th>
          </tr>
        </thead>
        <tbody>
${rows.map((row, index) => `          <tr>
            <td>
              <div class="site">${escapeHtml(row.site)}</div>
              <div>${escapeHtml(row.title || row.original)}</div>
            </td>
            <td>
              <button type="button" data-index="${index}">Open Pair</button>
              <a href="${escapeHtml(row.original)}" target="_blank" rel="noreferrer">Open Original</a>
              <a href="${escapeHtml(row.ours)}" target="_blank">Open Ours</a>
            </td>
            <td><div class="url">${escapeHtml(row.original)}</div></td>
            <td><div class="url">${escapeHtml(row.ours)}</div></td>
          </tr>`).join('\n')}
        </tbody>
      </table>
    </main>
    <script>
      const rows = ${JSON.stringify(rows)};
      document.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-index]');
        if (!button) return;
        const row = rows[Number(button.dataset.index)];
        window.open(row.original, '_blank', 'noopener,noreferrer');
        window.open(row.ours, '_blank');
      });
    </script>
  </body>
</html>
`);

console.log(`wrote full page links for ${rows.length} pages`);
