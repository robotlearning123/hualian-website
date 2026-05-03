import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const neuropixelsRoot = path.join(root, 'downloaded-sites', 'neuropixels', 'www.neuropixels.org');
const reportJson = path.join(root, 'docs', 'reports', 'wix-local-image-freeze-report.json');
const reportMd = path.join(root, 'docs', 'reports', 'wix-local-image-freeze-report.md');

const walk = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && full.endsWith('.html')) files.push(full);
  }
  return files;
};

const main = async () => {
  const changed = [];
  const files = await walk(neuropixelsRoot);
  for (const file of files) {
    const original = await fs.readFile(file, 'utf8');
    const updated = original.replaceAll(' data-image-info=', ' data-local-image-info=');
    if (updated !== original) {
      await fs.writeFile(file, updated);
      changed.push({
        file: path.relative(root, file),
        replacements: original.split(' data-image-info=').length - 1,
      });
    }
  }

  const summary = {
    generated_at: new Date().toISOString(),
    scanned_file_count: files.length,
    changed_file_count: changed.length,
    replacement_count: changed.reduce((sum, item) => sum + item.replacements, 0),
    changed,
  };

  await fs.writeFile(reportJson, `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(reportMd, `# Wix Local Image Freeze Report

Generated: ${summary.generated_at}

- Scanned files: ${summary.scanned_file_count}
- Changed files: ${summary.changed_file_count}
- Frozen image metadata attributes: ${summary.replacement_count}

${changed.map((item) => `- ${item.file}: ${item.replacements}`).join('\n')}
`);

  console.log(JSON.stringify(summary, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
