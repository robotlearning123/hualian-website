import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const baseUrl = (process.env.DEPLOYED_BASE_URL || '').replace(/\/$/, '');
if (!baseUrl) {
  console.error('Set DEPLOYED_BASE_URL to the deployed clone root.');
  process.exit(2);
}

const reportJson = path.join(root, 'docs', 'reports', 'deployed-site-http-report.json');
const reportMd = path.join(root, 'docs', 'reports', 'deployed-site-http-report.md');

const inventory = JSON.parse(await fs.readFile(
  path.join(root, 'docs', 'reports', 'public-interaction-inventory.json'),
  'utf8',
));

const checks = [
  { kind: 'entry', site: 'root', slug: 'root', path: '/' },
  {
    kind: 'entry',
    site: 'neuralink',
    slug: 'home',
    path: '/downloaded-sites/neuralink/neuralink.com/index.html',
  },
  {
    kind: 'entry',
    site: 'neuropixels',
    slug: 'home',
    path: '/downloaded-sites/neuropixels/www.neuropixels.org/index.html',
  },
  ...inventory.pages.map((page) => ({
    kind: 'manifest-page',
    site: page.site,
    slug: page.slug,
    source_url: page.url,
    path: `/${page.downloaded_path}`,
  })),
];

const timeoutMs = Number(process.env.DEPLOYED_HTTP_TIMEOUT_MS || 30_000);
const concurrency = Number(process.env.DEPLOYED_HTTP_CONCURRENCY || 8);

const checkOne = async (item) => {
  const url = `${baseUrl}${item.path}`;
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'public-research-clone-deployed-verifier' },
    });
    return {
      ...item,
      url,
      final_url: response.url,
      status: response.status,
      ok: response.ok,
      content_type: response.headers.get('content-type') || '',
      elapsed_ms: Date.now() - started,
    };
  } catch (error) {
    return {
      ...item,
      url,
      final_url: null,
      status: null,
      ok: false,
      error: error.message,
      elapsed_ms: Date.now() - started,
    };
  } finally {
    clearTimeout(timer);
  }
};

const runPool = async (items, workerCount) => {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: workerCount }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await checkOne(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
};

const rows = await runPool(checks, concurrency);
const failures = rows.filter((row) => !row.ok);
const summary = {
  generated_at: new Date().toISOString(),
  deployed_base_url: baseUrl,
  passed: failures.length === 0,
  check_count: rows.length,
  pass_count: rows.length - failures.length,
  failure_count: failures.length,
  entry_count: rows.filter((row) => row.kind === 'entry').length,
  manifest_page_count: rows.filter((row) => row.kind === 'manifest-page').length,
  failures,
  rows,
};

await fs.writeFile(reportJson, `${JSON.stringify(summary, null, 2)}\n`);
await fs.writeFile(reportMd, `# Deployed Site HTTP Report

Generated: ${summary.generated_at}

Base URL: ${summary.deployed_base_url}

Overall: ${summary.passed ? 'PASS' : 'FAIL'}

## Summary

- Checks: ${summary.check_count}
- Passed: ${summary.pass_count}
- Failed: ${summary.failure_count}
- Entry URLs: ${summary.entry_count}
- Manifest pages: ${summary.manifest_page_count}

## Failures

| Kind | Site | Slug | Status | URL |
| --- | --- | --- | --- | --- |
${failures.map((row) => `| ${row.kind} | ${row.site} | ${row.slug} | ${row.status ?? row.error ?? 'error'} | ${row.url} |`).join('\n') || '| none | none | none | none | none |'}
`);

console.log(JSON.stringify({
  passed: summary.passed,
  deployed_base_url: summary.deployed_base_url,
  check_count: summary.check_count,
  pass_count: summary.pass_count,
  failure_count: summary.failure_count,
}, null, 2));

if (!summary.passed) process.exit(1);
