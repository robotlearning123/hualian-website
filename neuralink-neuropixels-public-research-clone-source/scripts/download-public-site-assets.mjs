import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const ROOT = process.cwd();
const SCAN_TARGETS = [
  'downloaded-sites',
  'public-clone/raw-html',
  'public-clone/manifest.json',
];
const ASSET_DIR = path.join(ROOT, 'downloaded-sites', '_assets');
const REPORT_JSON = path.join(ROOT, 'docs', 'reports', 'public-site-download-report.json');
const REPORT_MD = path.join(ROOT, 'docs', 'reports', 'public-site-download-report.md');
const CONCURRENCY = Number(process.env.DOWNLOAD_CONCURRENCY || 8);
const USER_AGENT = 'Mozilla/5.0 public-research-clone/1.0';

const ALLOWED_HOSTS = [
  'neuralink.com',
  'www.neuropixels.org',
  'static.wixstatic.com',
  'video.wixstatic.com',
  'static.parastorage.com',
  'static.filesusr.com',
  'content.neuralink.com',
];

const RESOURCE_EXTENSIONS = new Set([
  '.html',
  '.css',
  '.js',
  '.mjs',
  '.json',
  '.xml',
  '.txt',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.avif',
  '.gif',
  '.svg',
  '.ico',
  '.mp4',
  '.webm',
  '.mov',
  '.m4v',
  '.pdf',
  '.xlsx',
  '.zip',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
]);

const TEXT_EXTENSIONS = new Set([
  '.html',
  '.orig',
  '.css',
  '.js',
  '.mjs',
  '.json',
  '.txt',
  '.xml',
]);

const siteForPath = (filePath) => {
  const normalized = filePath.split(path.sep).join('/');
  if (normalized.includes('/neuralink/') || normalized.includes('neuralink.com')) return 'neuralink';
  if (normalized.includes('/neuropixels/') || normalized.includes('neuropixels.org')) return 'neuropixels';
  return null;
};

const defaultOriginForSite = (site) => {
  if (site === 'neuralink') return 'https://neuralink.com';
  if (site === 'neuropixels') return 'https://www.neuropixels.org';
  return null;
};

const sha = (value, length = 12) =>
  crypto.createHash('sha1').update(value).digest('hex').slice(0, length);

const htmlDecode = (text) =>
  text
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#34;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');

const unescapeSlashes = (text) =>
  htmlDecode(text)
    .replace(/\\u002[Ff]/g, '/')
    .replace(/\\\//g, '/')
    .replace(/%5[Cc]\//g, '/');

const trimUrl = (value) => {
  let url = value.trim();
  url = url.replace(/\\u002[Ff]/g, '/').replace(/\\\//g, '/');
  url = url.replace(/^['"`(]+/, '');
  url = url.replace(/[.'"`,;:)>\]}]+$/g, '');
  url = url.replace(/&amp;/g, '&');
  return url;
};

const isAllowedHost = (hostname) => {
  const host = hostname.toLowerCase();
  return ALLOWED_HOSTS.includes(host) || host.endsWith('.filesusr.com');
};

const hasResourceExtension = (url) => {
  const ext = path.extname(url.pathname).toLowerCase();
  return RESOURCE_EXTENSIONS.has(ext);
};

const isStaticResource = (url) => {
  if (!isAllowedHost(url.hostname)) return false;
  const pathname = url.pathname;
  if (hasResourceExtension(url)) return true;
  if (url.hostname === 'static.wixstatic.com' && pathname.startsWith('/media/')) return true;
  if (url.hostname === 'video.wixstatic.com' && pathname.startsWith('/video/')) return true;
  if (url.hostname.endsWith('.filesusr.com') && pathname.startsWith('/ugd/')) return true;
  if (url.hostname === 'www.neuropixels.org' && pathname.startsWith('/_files/')) return true;
  if (url.hostname === 'neuralink.com' && (pathname.startsWith('/assets/') || pathname.startsWith('/pdfs/'))) return true;
  return false;
};

const typeForUrl = (url, contentType = '') => {
  const ext = path.extname(url.pathname).toLowerCase();
  if (ext === '.gif' || contentType.startsWith('image/gif')) return 'gif';
  if (contentType.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg', '.ico'].includes(ext)) return 'image';
  if (contentType.startsWith('video/') || ['.mp4', '.webm', '.mov', '.m4v'].includes(ext)) return 'video';
  if (contentType.includes('font') || ['.woff', '.woff2', '.ttf', '.otf', '.eot'].includes(ext)) return 'font';
  if (contentType.includes('pdf') || ext === '.pdf') return 'pdf';
  if (contentType.includes('css') || ext === '.css') return 'style';
  if (contentType.includes('javascript') || ['.js', '.mjs'].includes(ext)) return 'script';
  if (contentType.includes('json') || ext === '.json') return 'json';
  if (contentType.includes('html') || ext === '.html') return 'html';
  return ext ? ext.slice(1) : 'other';
};

const safeSegment = (segment) => {
  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    decoded = segment;
  }
  let safe = decoded.replace(/[^A-Za-z0-9._~=-]+/g, '_');
  if (!safe || safe === '.' || safe === '..') safe = '_';
  if (safe.length > 120) {
    const ext = path.extname(safe);
    safe = `${safe.slice(0, 80)}-${sha(safe, 10)}${ext}`;
  }
  return safe;
};

const localPathForUrl = (url) => {
  const parsed = new URL(url);
  if (parsed.hostname === 'static.wixstatic.com' && parsed.pathname.startsWith('/media/')) {
    const parts = parsed.pathname.split('/').filter(Boolean);
    const firstMediaName = parts[1] || 'media';
    const lastName = parts.at(-1) || firstMediaName;
    const ext = path.extname(lastName) || path.extname(firstMediaName) || '.bin';
    const baseSource = path.basename(firstMediaName, path.extname(firstMediaName)) || 'media';
    const fileName = `${safeSegment(baseSource)}.${sha(parsed.href, 12)}${ext}`;
    return path.join(ASSET_DIR, safeSegment(parsed.hostname), 'media-assets', fileName);
  }

  const queryHash = parsed.search ? `.${sha(parsed.search, 8)}` : '';
  const parts = parsed.pathname.split('/').filter(Boolean).map(safeSegment);
  if (parts.length === 0) parts.push('index');
  let last = parts[parts.length - 1];
  if (!path.extname(last)) last = `${last || 'index'}.bin`;
  if (queryHash) {
    const ext = path.extname(last);
    const base = last.slice(0, last.length - ext.length);
    last = `${base}${queryHash}${ext || '.bin'}`;
  }
  parts[parts.length - 1] = last;
  return path.join(ASSET_DIR, safeSegment(parsed.hostname), ...parts);
};

const addUrl = (urls, value, source, baseOrigin = null) => {
  const candidate = trimUrl(value);
  if (!candidate) return;
  if (
    candidate.includes('${') ||
    /%7[Bb]|%7[Dd]/.test(candidate) ||
    candidate.includes('{{') ||
    candidate.includes('}}')
  ) {
    return;
  }
  if (
    candidate.startsWith('/downloaded-sites/') ||
    candidate.startsWith('/public-clone/') ||
    candidate.startsWith('/media/')
  ) {
    return;
  }
  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    if (!baseOrigin || !candidate.startsWith('/')) return;
    try {
      parsed = new URL(candidate, baseOrigin);
    } catch {
      return;
    }
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return;
  if (parsed.hostname === 'static.wixstatic.com' && parsed.pathname.startsWith('/media-assets/')) return;
  if (parsed.hostname === 'static.wixstatic.com' && parsed.pathname === '/media/') return;
  if (parsed.hostname === 'video.wixstatic.com' && parsed.pathname === '/video/') return;
  if (!isStaticResource(parsed)) return;
  const normalized = parsed.href;
  if (!urls.has(normalized)) urls.set(normalized, { url: normalized, sources: new Set() });
  urls.get(normalized).sources.add(source);
};

const addWixMediaUri = (urls, uri, source) => {
  const cleaned = trimUrl(uri).replace(/\\\//g, '/');
  const imageMatch = cleaned.match(/wix:image:\/\/v1\/([^/#?]+)\//);
  if (imageMatch) {
    addUrl(urls, `https://static.wixstatic.com/media/${imageMatch[1]}`, source);
    return;
  }
  const videoMatch = cleaned.match(/wix:video:\/\/v1\/([^/#?]+)\//);
  if (videoMatch) {
    addUrl(urls, `https://video.wixstatic.com/video/${videoMatch[1]}/1080p/mp4/file.mp4`, source);
  }
};

const extractUrls = (text, source, site) => {
  const urls = new Map();
  const normalized = unescapeSlashes(text);
  const baseOrigin = defaultOriginForSite(site);

  for (const match of normalized.matchAll(/https?:\/\/[^\s"'`<>\\]+/g)) {
    addUrl(urls, match[0], source, baseOrigin);
  }

  for (const match of normalized.matchAll(/(?:^|[^A-Za-z0-9.:-])((?:neuralink\.com|www\.neuropixels\.org|static\.wixstatic\.com|video\.wixstatic\.com|static\.parastorage\.com|static\.filesusr\.com|[A-Za-z0-9-]+\.filesusr\.com)\/[^\s"'`<>\\)]+)/g)) {
    addUrl(urls, `https://${match[1]}`, source, baseOrigin);
  }

  for (const match of normalized.matchAll(/(?:src|href|content|poster|data-src|data-href)=["'](\/[^"']+)["']/gi)) {
    addUrl(urls, match[1], source, baseOrigin);
  }

  for (const match of normalized.matchAll(/url\(["']?(\/[^"')]+)["']?\)/gi)) {
    addUrl(urls, match[1], source, baseOrigin);
  }

  for (const match of normalized.matchAll(/wix:(?:image|video):\/\/v1\/[^"'<>\s)]+/g)) {
    addWixMediaUri(urls, match[0], source);
  }

  return urls;
};

const walkFiles = async (target) => {
  const full = path.join(ROOT, target);
  let stat;
  try {
    stat = await fs.stat(full);
  } catch {
    return [];
  }
  if (stat.isFile()) return [full];
  const files = [];
  const entries = await fs.readdir(full, { withFileTypes: true });
  for (const entry of entries) {
    const child = path.join(full, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(path.relative(ROOT, child)));
    } else if (entry.isFile()) {
      files.push(child);
    }
  }
  return files;
};

const readTextFiles = async () => {
  const files = [];
  for (const target of SCAN_TARGETS) files.push(...await walkFiles(target));
  const texts = [];
  for (const file of files) {
    if (file.includes('html-source-compare-standalone.html')) continue;
    const ext = path.extname(file).toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext) && !file.endsWith('.orig')) continue;
    const stat = await fs.stat(file);
    if (stat.size > 25 * 1024 * 1024) continue;
    const text = await fs.readFile(file, 'utf8');
    texts.push({ file, rel: path.relative(ROOT, file), text, site: siteForPath(file) });
  }
  return texts;
};

const mergeUrlMaps = (target, sourceMap) => {
  for (const [url, entry] of sourceMap) {
    if (!target.has(url)) target.set(url, { url, sources: new Set() });
    for (const source of entry.sources) target.get(url).sources.add(source);
  }
};

const downloadOne = async (entry) => {
  const outPath = localPathForUrl(entry.url);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  try {
    const existing = await fs.stat(outPath);
    if (existing.size > 0) {
      return { ...entry, status: 'skipped_existing', local_path: path.relative(ROOT, outPath), bytes: existing.size };
    }
  } catch {
    // download below
  }

  const response = await fetch(entry.url, {
    redirect: 'follow',
    headers: { 'user-agent': USER_AGENT },
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok || !response.body) {
    return { ...entry, status: 'failed', error: `HTTP ${response.status}` };
  }

  const tmpPath = `${outPath}.tmp`;
  try {
    await pipeline(Readable.fromWeb(response.body), (await import('node:fs')).createWriteStream(tmpPath));
    const stat = await fs.stat(tmpPath);
    await fs.rename(tmpPath, outPath);

    return {
      ...entry,
      status: 'downloaded',
      final_url: response.url,
      content_type: response.headers.get('content-type') || '',
      local_path: path.relative(ROOT, outPath),
      bytes: stat.size,
    };
  } catch (error) {
    await fs.rm(tmpPath, { force: true });
    throw error;
  }
};

const runPool = async (items, worker, concurrency) => {
  const results = [];
  let index = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index++];
      try {
        results.push(await worker(current));
      } catch (error) {
        results.push({ ...current, status: 'failed', error: error.message });
      }
    }
  });
  await Promise.all(runners);
  return results;
};

const summarize = (results, scannedFiles, candidateCount) => {
  const summary = {
    generated_at: new Date().toISOString(),
    scanned_file_count: scannedFiles.length,
    candidate_url_count: candidateCount,
    total_result_count: results.length,
    downloaded_count: results.filter((r) => r.status === 'downloaded').length,
    skipped_existing_count: results.filter((r) => r.status === 'skipped_existing').length,
    failed_count: results.filter((r) => r.status === 'failed').length,
    total_bytes: results.reduce((sum, r) => sum + (r.bytes || 0), 0),
    by_host: {},
    by_type: {},
  };
  for (const result of results) {
    let host = 'unknown';
    try {
      host = new URL(result.url).hostname;
    } catch {
      // keep unknown
    }
    summary.by_host[host] = (summary.by_host[host] || 0) + 1;
    const type = typeForUrl(new URL(result.url), result.content_type || '');
    summary.by_type[type] = (summary.by_type[type] || 0) + 1;
    result.type = type;
    result.sources = [...result.sources].slice(0, 10);
  }
  return summary;
};

const writeReports = async (summary, results) => {
  await fs.mkdir(path.dirname(REPORT_JSON), { recursive: true });
  const failed = results.filter((r) => r.status === 'failed');
  const report = { ...summary, failed, assets: results };
  await fs.writeFile(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);

  const rows = [
    '# Public Site Download Report',
    '',
    `Generated: ${summary.generated_at}`,
    '',
    `- Scanned text files: ${summary.scanned_file_count}`,
    `- Candidate public static URLs: ${summary.candidate_url_count}`,
    `- Downloaded now: ${summary.downloaded_count}`,
    `- Already present: ${summary.skipped_existing_count}`,
    `- Failed: ${summary.failed_count}`,
    `- Asset bytes on disk from this manifest: ${summary.total_bytes}`,
    '',
    '## By Type',
    '',
    ...Object.entries(summary.by_type).sort((a, b) => b[1] - a[1]).map(([type, count]) => `- ${type}: ${count}`),
    '',
    '## By Host',
    '',
    ...Object.entries(summary.by_host).sort((a, b) => b[1] - a[1]).map(([host, count]) => `- ${host}: ${count}`),
  ];
  if (failed.length > 0) {
    rows.push('', '## Failed URLs', '');
    for (const item of failed.slice(0, 50)) rows.push(`- ${item.url}: ${item.error}`);
  }
  await fs.writeFile(REPORT_MD, `${rows.join('\n')}\n`);
};

const main = async () => {
  const scannedFiles = await readTextFiles();
  const urls = new Map();
  for (const file of scannedFiles) mergeUrlMaps(urls, extractUrls(file.text, file.rel, file.site));

  const entries = [...urls.values()].sort((a, b) => a.url.localeCompare(b.url));
  const results = await runPool(entries, downloadOne, CONCURRENCY);
  const summary = summarize(results, scannedFiles, entries.length);
  await writeReports(summary, results.sort((a, b) => a.url.localeCompare(b.url)));

  console.log(JSON.stringify(summary, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
