import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = process.cwd();
const reportDir = path.join(root, 'docs', 'reports');
const jsonReport = path.join(reportDir, 'bdd-acceptance-report.json');
const mdReport = path.join(reportDir, 'bdd-acceptance-report.md');

const scenarios = [];

function scenario(name, given, when, then, test) {
  scenarios.push({ name, given, when, then, test });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readJson(file) {
  return JSON.parse(readFileSync(path.join(root, file), 'utf8'));
}

function pngDimensions(file) {
  const buffer = readFileSync(file);
  assert(buffer.length >= 24, `${file} is too small to be a PNG`);
  assert(buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47, `${file} is not a PNG`);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

async function gitLsFiles() {
  const { stdout } = await run('git', ['ls-files'], { cwd: root, timeout: 30000, maxBuffer: 20 * 1024 * 1024 });
  return stdout.trim().split('\n').filter(Boolean);
}

async function localHttpChecks(paths) {
  const server = spawn('python3', ['-m', 'http.server', '3481', '-d', 'public-clone'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  try {
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      try {
        const response = await fetch('http://127.0.0.1:3481/');
        if (response.status === 200) break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const ready = await fetch('http://127.0.0.1:3481/').then((response) => response.status === 200).catch(() => false);
    assert(ready, 'HTTP server did not start');

    for (const requestPath of paths) {
      const response = await fetch(`http://127.0.0.1:3481${requestPath}`);
      assert(response.status === 200, `${requestPath} returned ${response.status}`);
    }
  } finally {
    server.kill('SIGINT');
  }
}

async function withRootHttpServer(port, callback) {
  const baseUrl = `http://127.0.0.1:${port}`;
  const alreadyReady = await fetch(`${baseUrl}/`).then((response) => response.status === 200).catch(() => false);
  let server = null;

  if (!alreadyReady) {
    server = spawn('python3', ['-m', 'http.server', String(port), '-d', root], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      const ready = await fetch(`${baseUrl}/`).then((response) => response.status === 200).catch(() => false);
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  const ready = await fetch(`${baseUrl}/`).then((response) => response.status === 200).catch(() => false);
  assert(ready, `HTTP server did not start on ${port}`);

  try {
    return await callback(baseUrl);
  } finally {
    if (server) server.kill('SIGINT');
  }
}

scenario(
  'Public discovery scope is complete and clean',
  'Given the saved public-page manifest',
  'When the public page and document counts are evaluated',
  'Then it contains only successful public pages for both sites',
  async () => {
    const manifest = readJson('public-clone/manifest.json');
    const bySite = manifest.pages.reduce((acc, page) => {
      acc[page.site] = (acc[page.site] || 0) + 1;
      return acc;
    }, {});
    assert(manifest.page_count === 69, `expected 69 pages, got ${manifest.page_count}`);
    assert(manifest.document_count === 30, `expected 30 public document links, got ${manifest.document_count}`);
    assert(bySite.neuralink === 40, `expected 40 Neuralink pages, got ${bySite.neuralink}`);
    assert(bySite.neuropixels === 29, `expected 29 Neuropixels pages, got ${bySite.neuropixels}`);
    assert(manifest.pages.every((page) => !page.error), 'manifest contains page errors');
    assert(manifest.pages.every((page) => /^https:\/\/(neuralink\.com|www\.neuropixels\.org)\//.test(page.url)), 'manifest contains out-of-scope URL');
  }
);

scenario(
  'Every public page has local clone files and raw screenshots',
  'Given every manifest page',
  'When the local page and screenshot assets are inspected',
  'Then each page has an HTML clone plus desktop and mobile PNG assets with matching dimensions',
  async () => {
    const manifest = readJson('public-clone/manifest.json');
    for (const page of manifest.pages) {
      const pageDir = path.join(root, 'public-clone', 'sites', page.site, page.slug);
      assert(existsSync(path.join(pageDir, 'index.html')), `${page.url} missing index.html`);
      for (const viewport of ['desktop', 'mobile']) {
        const asset = path.join(pageDir, 'assets', `${viewport}.png`);
        assert(existsSync(asset), `${page.url} missing ${viewport}.png`);
        const dims = pngDimensions(asset);
        const capture = page.captures[viewport];
        assert(dims.width === capture.width, `${page.url} ${viewport} width mismatch`);
        assert(dims.height === capture.height, `${page.url} ${viewport} height mismatch`);
      }
    }
  }
);

scenario(
  'Raw screenshots and local clone renders match',
  'Given the generated visual comparison report',
  'When every desktop and mobile comparison row is evaluated',
  'Then all 138 raw-vs-clone comparisons pass and failures are zero',
  async () => {
    const comparison = readJson('docs/reports/public-clone-visual-comparison.json');
    assert(comparison.summary.checked_renders === 138, `expected 138 render comparisons, got ${comparison.summary.checked_renders}`);
    assert(comparison.summary.pass_count === 138, `expected 138 passed renders, got ${comparison.summary.pass_count}`);
    assert(comparison.summary.failure_count === 0, `expected 0 failed renders, got ${comparison.summary.failure_count}`);
    assert(comparison.summary.exact_count === 137, `expected 137 pixel-perfect renders, got ${comparison.summary.exact_count}`);
    assert(comparison.rows.every((row) => row.pass === true), 'one or more visual rows failed');
  }
);

scenario(
  'Static references resolve',
  'Given the static homepage clones',
  'When local href/src/poster references are checked',
  'Then all referenced local files exist',
  async () => {
    await run('node', ['scripts/check-static.mjs'], { cwd: root, timeout: 30000 });
  }
);

scenario(
  'Repository excludes runtime caches and private execution state',
  'Given the files tracked by git',
  'When ignored and sensitive paths are checked',
  'Then runtime caches are not tracked and common secret material is absent',
  async () => {
    const files = await gitLsFiles();
    assert(!files.some((file) => file.startsWith('.omx/')), '.omx runtime state is tracked');
    assert(!files.some((file) => file.startsWith('output/')), 'output cache is tracked');
    assert(!files.some((file) => file.startsWith('node_modules/')), 'node_modules is tracked');
    for (const file of files.filter((item) => /\.(?:js|mjs|json|md|html|css|txt|yml|yaml)$/.test(item))) {
      const text = readFileSync(path.join(root, file), 'utf8');
      assert(!/(gho_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|BEGIN (?:RSA|OPENSSH|EC) PRIVATE KEY)/.test(text), `${file} appears to contain secret material`);
    }
  }
);

scenario(
  'GitHub repository is private',
  'Given the configured GitHub remote',
  'When GitHub repository metadata is queried',
  'Then the repository visibility is PRIVATE',
  async () => {
    const { stdout } = await run('gh', [
      'repo',
      'view',
      'robotlearning123/neuralink-neuropixels-public-research-clone',
      '--json',
      'visibility',
      '--jq',
      '.visibility'
    ], { cwd: root, timeout: 30000 });
    assert(stdout.trim() === 'PRIVATE', `expected PRIVATE visibility, got ${stdout.trim()}`);
  }
);

scenario(
  'Local public clone serves key pages',
  'Given the generated public-clone directory',
  'When it is served through a local HTTP server',
  'Then the index and representative pages return HTTP 200',
  async () => {
    await localHttpChecks([
      '/',
      '/sites/neuralink/home/index.html',
      '/sites/neuralink/updates-the-role-of-the-institutional-animal-care-and-use-committee/index.html',
      '/sites/neuropixels/home/index.html',
      '/sites/neuropixels/probes-np2-0/index.html'
    ]);
  }
);

scenario(
  'Public source assets are downloaded locally',
  'Given the full public-site download report',
  'When public static resources are counted by type',
  'Then the local mirror includes pages, scripts, images, PDFs, GIFs, and videos with only known public CDN misses',
  async () => {
    const report = readJson('docs/reports/public-site-download-report.json');
    assert(report.candidate_url_count >= 13292, `expected at least 13292 candidate URLs, got ${report.candidate_url_count}`);
    assert(report.skipped_existing_count + report.downloaded_count >= 13281, 'expected downloaded/existing public assets');
    assert(report.failed_count <= 11, `expected at most 11 failed public CDN URLs, got ${report.failed_count}`);
    assert(report.total_bytes > 1_000_000_000, `expected >1GB mirrored assets, got ${report.total_bytes}`);
    assert(report.by_type.video >= 10, `expected at least 10 video assets, got ${report.by_type.video}`);
    assert(report.by_type.gif >= 3, `expected at least 3 GIF assets, got ${report.by_type.gif}`);
    assert(report.by_type.image >= 226, `expected at least 226 image assets, got ${report.by_type.image}`);
    assert(report.by_type.pdf >= 30, `expected at least 30 PDFs, got ${report.by_type.pdf}`);
  }
);

scenario(
  'Public interactions are inventoried',
  'Given the raw public HTML interaction inventory',
  'When links, buttons, forms, and menu triggers are counted',
  'Then the research clone has a page-backed inventory for public front-end behavior',
  async () => {
    const inventory = readJson('docs/reports/public-interaction-inventory.json');
    const totals = inventory.summary.totals;
    assert(inventory.summary.page_count === 69, `expected 69 inventoried pages, got ${inventory.summary.page_count}`);
    assert(totals.links === 1256, `expected 1256 links, got ${totals.links}`);
    assert(totals.buttons === 331, `expected 331 buttons, got ${totals.buttons}`);
    assert(totals.forms === 1, `expected 1 form, got ${totals.forms}`);
    assert(totals.inputs === 10, `expected 10 inputs, got ${totals.inputs}`);
    assert(totals.menu_triggers === 306, `expected 306 menu triggers, got ${totals.menu_triggers}`);
    assert(inventory.summary.links_by_kind.download === 55, `expected 55 download links, got ${inventory.summary.links_by_kind.download}`);
  }
);

scenario(
  'Public GIF and video media are locally playable',
  'Given the synchronized media gallery manifest',
  'When local media files and the gallery HTML are inspected',
  'Then all detected public GIF/video assets exist in the clone',
  async () => {
    const media = readJson('public-clone/media/manifest.json');
    assert(media.media_count === 12, `expected 12 media assets, got ${media.media_count}`);
    assert(media.video_count === 9, `expected 9 videos, got ${media.video_count}`);
    assert(media.gif_count === 3, `expected 3 GIFs, got ${media.gif_count}`);
    assert(media.total_bytes > 40_000_000, `expected >40MB media bytes, got ${media.total_bytes}`);
    for (const item of media.media) {
      assert(existsSync(path.join(root, 'public-clone', item.local_path)), `${item.local_path} missing`);
    }
    const gallery = readFileSync(path.join(root, 'public-clone', 'media', 'index.html'), 'utf8');
    assert((gallery.match(/<video\b/g) || []).length >= 9, 'media gallery is missing video tags');
    assert((gallery.match(/<img\b/g) || []).length >= 3, 'media gallery is missing GIF image tags');
  }
);

scenario(
  'Downloaded HTML mirrors support public interactions',
  'Given the downloaded local mirrors for Neuralink and Neuropixels',
  'When a clean headless Chrome opens and clicks representative controls',
  'Then local pages render, media loads, navigation works, and original static assets are not requested',
  async () => {
    await withRootHttpServer(3492, async () => {
      await run('node', ['scripts/verify-downloaded-sites-interactive.mjs'], { cwd: root, timeout: 420000 });
    });
    const report = readJson('docs/reports/downloaded-site-interactive-report.json');
    assert(report.passed === true, 'interactive downloaded-site report did not pass');
    assert(report.results.length === 3, `expected 3 interactive page groups, got ${report.results.length}`);
    for (const result of report.results) {
      assert(result.passed === true, `${result.name} failed`);
      assert(result.remote_static_requests.length === 0, `${result.name} requested original static assets`);
    }
    assert(report.interaction_coverage.passed === true, 'full public interaction coverage did not pass');
    assert(report.interaction_coverage.page_count === 69, `expected 69 interaction pages, got ${report.interaction_coverage.page_count}`);
    assert(report.interaction_coverage.internal_link_count === 1118, `expected 1118 internal links, got ${report.interaction_coverage.internal_link_count}`);
    assert(report.interaction_coverage.clicked_control_count >= 331, `expected at least 331 clicked controls, got ${report.interaction_coverage.clicked_control_count}`);
    assert(report.interaction_coverage.remote_static_requests.length === 0, 'interaction coverage requested original static assets');
    assert(report.rendered_sitewide_coverage.passed === true, 'rendered sitewide click tree did not pass');
    assert(report.rendered_sitewide_coverage.rendered_page_count === 69, `expected 69 rendered pages, got ${report.rendered_sitewide_coverage.rendered_page_count}`);
    assert(report.rendered_sitewide_coverage.totals.clicked_links === report.rendered_sitewide_coverage.totals.actionable_links, 'not every rendered link was clicked');
    assert(report.rendered_sitewide_coverage.totals.clicked_controls === report.rendered_sitewide_coverage.totals.rendered_controls, 'not every rendered control was clicked');
    assert(report.rendered_sitewide_coverage.totals.broken_local_internal_links === 0, 'rendered sitewide tree has broken local internal links');
    assert(report.rendered_sitewide_coverage.totals.remote_static_requests === 0, 'rendered sitewide tree requested original static assets');
    assert(report.rendered_sitewide_coverage.totals.blocking_runtime_exceptions === 0, 'rendered sitewide tree has blocking runtime exceptions');
    assert(existsSync(path.join(root, 'docs', 'reports', 'site-tree-click-trace.json')), 'site tree click trace JSON missing');
  }
);

const results = [];

for (const item of scenarios) {
  const started = Date.now();
  try {
    await item.test();
    results.push({ ...item, status: 'PASS', duration_ms: Date.now() - started });
    console.log(`PASS ${item.name}`);
  } catch (error) {
    results.push({ ...item, status: 'FAIL', duration_ms: Date.now() - started, error: error.message });
    console.error(`FAIL ${item.name}: ${error.message}`);
  }
}

const failed = results.filter((result) => result.status !== 'PASS');

await mkdir(reportDir, { recursive: true });
await writeFile(jsonReport, JSON.stringify({
  generated_at: new Date().toISOString(),
  scenario_count: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  results
}, null, 2));

await writeFile(mdReport, `# BDD Acceptance Report

Generated at: ${new Date().toISOString()}

## Summary

- Scenarios: ${results.length}
- Passed: ${results.length - failed.length}
- Failed: ${failed.length}

## Scenarios

${results.map((result) => `### ${result.status} - ${result.name}

${result.given}

${result.when}

${result.then}

Duration: ${result.duration_ms} ms${result.error ? `\n\nError: ${result.error}` : ''}
`).join('\n')}
`);

console.log(`scenario_count=${results.length}`);
console.log(`passed=${results.length - failed.length}`);
console.log(`failed=${failed.length}`);

if (failed.length > 0) process.exit(1);
