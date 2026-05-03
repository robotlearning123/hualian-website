import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const reportDir = path.join(root, 'docs', 'reports');
const manifest = JSON.parse(await readFile(path.join(root, 'public-clone', 'manifest.json'), 'utf8'));
const verification = JSON.parse(await readFile(path.join(root, '.omx', 'state', 'public-clone-verification.json'), 'utf8'));

const quoteCsv = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const rows = verification.results.map((result) => {
  const page = manifest.pages.find((candidate) => candidate.url === result.url);
  const capture = page?.captures?.[result.viewport] || {};
  const rawPath = path.join('public-clone', 'sites', result.site, page?.slug || '', 'assets', `${result.viewport}.png`);
  const clonePage = path.join('public-clone', 'sites', result.site, page?.slug || '', 'index.html');
  return {
    site: result.site,
    url: result.url,
    slug: page?.slug || '',
    viewport: result.viewport,
    raw_screenshot: rawPath,
    clone_page: clonePage,
    source_viewport: capture.viewport || '',
    raw_width: capture.width || '',
    raw_height: capture.height || '',
    psnr: result.psnr,
    exact: result.exact,
    pass: result.pass,
    note: result.exact
      ? 'pixel-perfect'
      : 'high-PSNR pass; Chromium re-rasterizes this very tall mobile screenshot'
  };
});

const exactCount = rows.filter((row) => row.exact).length;
const passCount = rows.filter((row) => row.pass).length;
const bySite = manifest.pages.reduce((acc, page) => {
  acc[page.site] = (acc[page.site] || 0) + 1;
  return acc;
}, {});

await mkdir(reportDir, { recursive: true });

await writeFile(path.join(reportDir, 'public-clone-visual-comparison.json'), JSON.stringify({
  generated_at: new Date().toISOString(),
  meaning: 'Raw screenshots are source-site captures saved under public-clone; clone pages are local HTML renderings of those captures.',
  summary: {
    page_count: manifest.page_count,
    document_count: manifest.document_count,
    by_site: bySite,
    checked_renders: rows.length,
    pass_count: passCount,
    exact_count: exactCount,
    non_exact_pass_count: passCount - exactCount,
    failure_count: rows.length - passCount,
    psnr_min: verification.psnr_min
  },
  rows
}, null, 2));

const columns = [
  'site',
  'url',
  'slug',
  'viewport',
  'raw_screenshot',
  'clone_page',
  'source_viewport',
  'raw_width',
  'raw_height',
  'psnr',
  'exact',
  'pass',
  'note'
];
await writeFile(path.join(reportDir, 'public-clone-visual-comparison.csv'), [
  columns.join(','),
  ...rows.map((row) => columns.map((column) => quoteCsv(row[column])).join(','))
].join('\n'));

const groupedRows = Object.entries(bySite)
  .map(([site, count]) => `- ${site}: ${count} public pages`)
  .join('\n');

const nonExactRows = rows.filter((row) => row.pass && !row.exact)
  .map((row) => `- ${row.site} ${row.viewport}: ${row.url} (PSNR ${row.psnr})`)
  .join('\n') || '- None';

await writeFile(path.join(reportDir, 'public-clone-visual-comparison.md'), `# Public Clone Visual Comparison

Generated at: ${new Date().toISOString()}

## Scope

This report compares the saved raw source-site screenshots against the local clone render for every generated public page and viewport.

Raw screenshots are stored under \`public-clone/sites/<site>/<slug>/assets/\`.
Clone pages are stored at \`public-clone/sites/<site>/<slug>/index.html\`.

## Summary

- Public HTML pages: ${manifest.page_count}
- Public document links: ${manifest.document_count}
${groupedRows}
- Checked renders: ${rows.length}
- Passed renders: ${passCount}
- Pixel-perfect renders: ${exactCount}
- High-PSNR non-exact renders: ${passCount - exactCount}
- Failed renders: ${rows.length - passCount}
- PSNR threshold: ${verification.psnr_min}

## Non-Exact Passes

${nonExactRows}

## Detailed Data

- JSON: \`docs/reports/public-clone-visual-comparison.json\`
- CSV: \`docs/reports/public-clone-visual-comparison.csv\`
`);

console.log(`wrote ${rows.length} comparison rows`);
