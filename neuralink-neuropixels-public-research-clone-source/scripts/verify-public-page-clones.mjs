import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const outRoot = path.join(root, 'public-clone');
const manifestPath = path.join(outRoot, 'manifest.json');
const tempRoot = path.join(root, '.omx', 'state', 'public-clone-verify');
const reportPath = path.join(root, '.omx', 'state', 'public-clone-verification.json');
const run = promisify(execFile);
const maxPages = Number(process.env.VERIFY_MAX_PAGES || 0);
const filterText = process.env.VERIFY_FILTER || '';
const psnrMin = Number(process.env.PSNR_MIN || 75);

const viewports = [
  { id: 'desktop', width: 1440, height: 1000 },
  { id: 'mobile', width: 390, height: 844 }
];

async function screenshotLocalPage(page, viewport, output) {
  const pagePath = path.join(outRoot, 'sites', page.site, page.slug, 'index.html');
  await run('npx', [
    '--yes',
    'playwright',
    'screenshot',
    '--full-page',
    '--wait-for-timeout',
    '100',
    '--viewport-size',
    `${viewport.width},${viewport.height}`,
    pathToFileURL(pagePath).href,
    output
  ], {
    cwd: root,
    timeout: 60000,
    maxBuffer: 1024 * 1024 * 2
  });
}

async function psnr(reference, actual) {
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
      '-'
    ], {
      cwd: root,
      timeout: 60000,
      maxBuffer: 1024 * 1024 * 2
    });
    const match = stderr.match(/average:([^\s]+)/);
    return match ? match[1] : 'unknown';
  } catch (error) {
    return `error:${error.message}`;
  }
}

async function main() {
  await mkdir(tempRoot, { recursive: true });
  await mkdir(path.dirname(reportPath), { recursive: true });

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const filteredPages = filterText
    ? manifest.pages.filter((page) => page.url.includes(filterText) || page.slug.includes(filterText))
    : manifest.pages;
  const pages = maxPages > 0 ? filteredPages.slice(0, maxPages) : filteredPages;
  const results = [];

  for (const [index, page] of pages.entries()) {
    console.log(`[${index + 1}/${pages.length}] ${page.url}`);
    for (const viewport of viewports) {
      const reference = path.join(outRoot, 'sites', page.site, page.slug, 'assets', `${viewport.id}.png`);
      const actual = path.join(tempRoot, `${page.site}-${page.slug}-${viewport.id}.png`);
      await screenshotLocalPage(page, viewport, actual);
      const score = await psnr(reference, actual);
      const numericScore = Number(score);
      const exact = score === 'inf';
      const tolerancePass = Number.isFinite(numericScore) && numericScore >= psnrMin;
      results.push({
        site: page.site,
        url: page.url,
        viewport: viewport.id,
        reference: path.relative(root, reference),
        actual: path.relative(root, actual),
        psnr: score,
        exact,
        pass: exact || tolerancePass
      });
    }
  }

  const failures = results.filter((result) => !result.pass);
  const exactCount = results.filter((result) => result.exact).length;
  await writeFile(reportPath, JSON.stringify({
    generated_at: new Date().toISOString(),
    checked_pages: pages.length,
    checked_renders: results.length,
    exact_count: exactCount,
    psnr_min: psnrMin,
    failure_count: failures.length,
    results
  }, null, 2));

  console.log(`checked_pages=${pages.length}`);
  console.log(`checked_renders=${results.length}`);
  console.log(`exact_count=${exactCount}`);
  console.log(`psnr_min=${psnrMin}`);
  console.log(`failure_count=${failures.length}`);
  if (failures.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
