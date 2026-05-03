import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourceReport = path.join(root, 'docs', 'reports', 'public-site-download-report.json');
const outDir = path.join(root, 'public-clone', 'media');
const assetDir = path.join(outDir, 'assets');
const manifestPath = path.join(outDir, 'manifest.json');
const indexPath = path.join(outDir, 'index.html');

const sha = (value, length = 10) => crypto.createHash('sha1').update(value).digest('hex').slice(0, length);

const safeName = (value) => {
  const basename = path.basename(new URL(value).pathname) || 'media';
  const ext = path.extname(basename) || '.bin';
  const stem = basename.slice(0, basename.length - ext.length).replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 90) || 'media';
  return `${stem}.${sha(value)}${ext}`;
};

const mediaType = (asset) => {
  const ext = path.extname(new URL(asset.url).pathname).toLowerCase();
  if (asset.type === 'video' || ['.mp4', '.webm', '.mov', '.m4v'].includes(ext)) return 'video';
  if (asset.type === 'gif' || ext === '.gif' || asset.content_type === 'image/gif') return 'gif';
  return null;
};

const main = async () => {
  const report = JSON.parse(await fs.readFile(sourceReport, 'utf8'));
  await fs.mkdir(assetDir, { recursive: true });

  const copied = [];
  for (const asset of report.assets) {
    const type = mediaType(asset);
    if (!type || !asset.local_path || asset.status === 'failed') continue;
    const sourcePath = path.join(root, asset.local_path);
    const fileName = safeName(asset.url);
    const localPath = path.join(assetDir, fileName);
    await fs.copyFile(sourcePath, localPath);
    const stat = await fs.stat(localPath);
    copied.push({
      type,
      url: asset.url,
      source_local_path: asset.local_path,
      local_path: path.relative(path.join(root, 'public-clone'), localPath),
      bytes: stat.size,
      sources: asset.sources || [],
    });
  }

  copied.sort((a, b) => a.type.localeCompare(b.type) || a.url.localeCompare(b.url));

  const manifest = {
    generated_at: new Date().toISOString(),
    media_count: copied.length,
    video_count: copied.filter((item) => item.type === 'video').length,
    gif_count: copied.filter((item) => item.type === 'gif').length,
    total_bytes: copied.reduce((sum, item) => sum + item.bytes, 0),
    media: copied,
  };

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const cards = copied.map((item) => {
    const rel = item.local_path.replace(/^media\//, '');
    const escapedUrl = item.url.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
    const media = item.type === 'video'
      ? `<video controls muted playsinline src="${rel}"></video>`
      : `<img src="${rel}" alt="Downloaded GIF asset">`;
    return `<article>
      ${media}
      <p><strong>${item.type.toUpperCase()}</strong> ${item.bytes.toLocaleString()} bytes</p>
      <a href="${rel}">Open local media</a>
      <code>${escapedUrl}</code>
    </article>`;
  }).join('\n');

  await fs.writeFile(indexPath, `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Downloaded Public Media</title>
    <style>
      body { margin: 0; font-family: Arial, sans-serif; background: #111; color: #f7f2e8; }
      main { width: min(1180px, calc(100% - 32px)); margin: 32px auto; }
      h1 { font-size: 28px; font-weight: 500; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; }
      article { border: 1px solid #3b3934; padding: 12px; background: #191815; }
      video, img { width: 100%; aspect-ratio: 16 / 9; object-fit: contain; background: #000; display: block; }
      a { color: #f2c46d; display: inline-block; margin: 8px 0; }
      code { display: block; color: #d7d0c3; overflow-wrap: anywhere; font-size: 12px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Downloaded Public GIF and Video Assets</h1>
      <p>${manifest.video_count} videos, ${manifest.gif_count} GIFs copied into this clone.</p>
      <section class="grid">
        ${cards}
      </section>
    </main>
  </body>
</html>
`);

  console.log(JSON.stringify(manifest, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
