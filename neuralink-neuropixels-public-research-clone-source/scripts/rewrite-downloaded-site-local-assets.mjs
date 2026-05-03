import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const reportPath = path.join(root, 'docs', 'reports', 'public-site-download-report.json');
const downloadedRoot = path.join(root, 'downloaded-sites');
const reportJson = path.join(root, 'docs', 'reports', 'downloaded-site-local-rewrite-report.json');
const reportMd = path.join(root, 'docs', 'reports', 'downloaded-site-local-rewrite-report.md');

const TEXT_EXTENSIONS = new Set(['.html', '.css', '.js', '.mjs', '.json', '.xml', '.txt']);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const jsEscapedUrl = (value) => value.replaceAll('/', '\\/');

const walk = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
};

const buildReplacements = async () => {
  const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
  const replacements = [];
  for (const asset of report.assets) {
    if (asset.status === 'failed' || !asset.local_path) continue;
    const absoluteLocal = `/${asset.local_path.split(path.sep).join('/')}`;
    replacements.push([asset.url, absoluteLocal]);
    replacements.push([jsEscapedUrl(asset.url), jsEscapedUrl(absoluteLocal)]);
  }
  replacements.sort((a, b) => b[0].length - a[0].length);
  return replacements;
};

const main = async () => {
  const replacements = await buildReplacements();
  const files = (await walk(downloadedRoot))
    .filter((file) => TEXT_EXTENSIONS.has(path.extname(file).toLowerCase()) || file.endsWith('.orig'));

  const changed = [];
  let totalReplacements = 0;

  for (const file of files) {
    const stat = await fs.stat(file);
    if (stat.size > 30 * 1024 * 1024) continue;
    let text = await fs.readFile(file, 'utf8');
    let count = 0;
    for (const [from, to] of replacements) {
      if (!text.includes(from)) continue;
      const matches = text.match(new RegExp(escapeRegExp(from), 'g'));
      if (!matches) continue;
      count += matches.length;
      text = text.replaceAll(from, to);
    }
    if (count > 0) {
      await fs.writeFile(file, text);
      changed.push({ file: path.relative(root, file), replacements: count });
      totalReplacements += count;
    }
  }

  const summary = {
    generated_at: new Date().toISOString(),
    scanned_file_count: files.length,
    changed_file_count: changed.length,
    replacement_count: totalReplacements,
    changed,
  };

  await fs.writeFile(reportJson, `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(reportMd, `# Downloaded Site Local Rewrite Report

Generated: ${summary.generated_at}

- Scanned files: ${summary.scanned_file_count}
- Changed files: ${summary.changed_file_count}
- URL replacements: ${summary.replacement_count}

## Changed Files

${changed.map((item) => `- ${item.file}: ${item.replacements}`).join('\n')}
`);

  console.log(JSON.stringify(summary, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
