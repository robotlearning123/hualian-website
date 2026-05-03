import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, 'public-clone', 'manifest.json');
const reportJson = path.join(root, 'docs', 'reports', 'public-interaction-inventory.json');
const reportMd = path.join(root, 'docs', 'reports', 'public-interaction-inventory.md');

const attr = (tag, name) => {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'=<>` + '`' + `]+))`, 'i'));
  return match ? (match[2] ?? match[3] ?? match[4] ?? '') : '';
};

const stripTags = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const decodeBasic = (value) =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#34;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');

const slugToDownloadedPath = (page) => {
  if (page.site === 'neuralink') {
    const url = new URL(page.url);
    const pathname = url.pathname === '/' ? '/index.html' : `${url.pathname.replace(/\/$/, '')}/index.html`;
    return path.join(root, 'downloaded-sites', 'neuralink', 'neuralink.com', pathname);
  }
  const url = new URL(page.url);
  if (url.pathname === '/') {
    return path.join(root, 'downloaded-sites', 'neuropixels', 'www.neuropixels.org', 'index.html');
  }
  return path.join(root, 'downloaded-sites', 'neuropixels', 'www.neuropixels.org', `${decodeURIComponent(url.pathname.slice(1))}.html`);
};

const localClonePath = (page) =>
  path.join(root, 'public-clone', 'sites', page.site, page.slug, 'index.html');

const classifyHref = (href, pageUrl) => {
  if (!href) return 'empty';
  if (href.startsWith('#')) return 'anchor';
  if (/^javascript:/i.test(href)) return 'javascript';
  if (/^mailto:/i.test(href)) return 'mailto';
  if (/^tel:/i.test(href)) return 'tel';
  if (/^data:/i.test(href)) return 'data';
  let parsed;
  try {
    parsed = new URL(href, pageUrl);
  } catch {
    return 'invalid';
  }
  if (/\.(pdf|zip|xlsx?|docx?|csv)(?:$|\?)/i.test(parsed.pathname)) return 'download';
  if (parsed.hostname === 'neuralink.com' || parsed.hostname === 'www.neuropixels.org') return 'internal';
  return 'external';
};

const summarizeLinks = (links) => {
  const summary = {};
  for (const link of links) summary[link.kind] = (summary[link.kind] || 0) + 1;
  return summary;
};

const extractInteraction = (html, page) => {
  const links = [];
  const buttons = [];
  const forms = [];
  const inputs = [];
  const videos = [];
  const details = [];
  const ariaMenuTriggers = [];

  for (const match of html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)) {
    const tag = match[0].split('>')[0] + '>';
    const href = decodeBasic(attr(tag, 'href'));
    const text = decodeBasic(stripTags(match[1])).slice(0, 120);
    links.push({
      href,
      text,
      kind: classifyHref(href, page.url),
      target: attr(tag, 'target') || null,
      download: attr(tag, 'download') || null,
    });
  }

  for (const match of html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi)) {
    const tag = match[0].split('>')[0] + '>';
    buttons.push({
      text: decodeBasic(stripTags(match[1])).slice(0, 120),
      type: attr(tag, 'type') || 'button',
      ariaLabel: attr(tag, 'aria-label') || null,
      ariaExpanded: attr(tag, 'aria-expanded') || null,
      ariaHaspopup: attr(tag, 'aria-haspopup') || null,
    });
  }

  for (const match of html.matchAll(/<[^>]+\srole=["']button["'][^>]*>/gi)) {
    const tag = match[0];
    buttons.push({
      text: decodeBasic(stripTags(tag)).slice(0, 120),
      type: attr(tag, 'type') || 'role-button',
      ariaLabel: attr(tag, 'aria-label') || null,
      ariaExpanded: attr(tag, 'aria-expanded') || null,
      ariaHaspopup: attr(tag, 'aria-haspopup') || null,
    });
  }

  for (const match of html.matchAll(/<form\b[^>]*>/gi)) {
    const tag = match[0];
    forms.push({
      action: decodeBasic(attr(tag, 'action')),
      method: (attr(tag, 'method') || 'get').toLowerCase(),
    });
  }

  for (const match of html.matchAll(/<(input|select|textarea)\b[^>]*>/gi)) {
    const tag = match[0];
    inputs.push({
      tag: match[1].toLowerCase(),
      type: attr(tag, 'type') || null,
      name: attr(tag, 'name') || null,
      placeholder: attr(tag, 'placeholder') || null,
      ariaLabel: attr(tag, 'aria-label') || null,
    });
  }

  for (const match of html.matchAll(/<video\b[\s\S]*?<\/video>|<video\b[^>]*>/gi)) {
    const block = match[0];
    const tag = block.split('>')[0] + '>';
    const sources = [];
    const src = attr(tag, 'src');
    if (src) sources.push(decodeBasic(src));
    for (const sourceMatch of block.matchAll(/<source\b[^>]*>/gi)) {
      const sourceSrc = attr(sourceMatch[0], 'src');
      if (sourceSrc) sources.push(decodeBasic(sourceSrc));
    }
    videos.push({
      controls: /\scontrols(?:\s|>|=)/i.test(tag),
      autoplay: /\sautoplay(?:\s|>|=)/i.test(tag),
      loop: /\sloop(?:\s|>|=)/i.test(tag),
      muted: /\smuted(?:\s|>|=)/i.test(tag),
      poster: decodeBasic(attr(tag, 'poster')),
      sources: [...new Set(sources)],
    });
  }

  for (const match of html.matchAll(/<details\b[^>]*>/gi)) details.push({ open: /\sopen(?:\s|>|=)/i.test(match[0]) });

  for (const match of html.matchAll(/<[^>]+\saria-haspopup=["'][^"']+["'][^>]*>/gi)) {
    ariaMenuTriggers.push({
      tag: match[0].match(/^<([a-z0-9-]+)/i)?.[1]?.toLowerCase() || 'element',
      ariaLabel: attr(match[0], 'aria-label') || null,
      ariaExpanded: attr(match[0], 'aria-expanded') || null,
    });
  }

  return {
    link_count: links.length,
    button_count: buttons.length,
    form_count: forms.length,
    input_count: inputs.length,
    video_count: videos.length,
    details_count: details.length,
    menu_trigger_count: ariaMenuTriggers.length,
    links_by_kind: summarizeLinks(links),
    links: links.slice(0, 100),
    buttons: buttons.slice(0, 100),
    forms,
    inputs: inputs.slice(0, 100),
    videos,
    details,
    aria_menu_triggers: ariaMenuTriggers.slice(0, 100),
  };
};

const exists = async (file) => {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
};

const main = async () => {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const pages = [];

  for (const page of manifest.pages) {
    const downloadedPath = slugToDownloadedPath(page);
    const rawPath = path.join(root, 'public-clone', 'raw-html', 'sites', page.site, page.slug, 'source.html');
    const sourcePath = await exists(rawPath) ? rawPath : downloadedPath;
    const html = await fs.readFile(sourcePath, 'utf8');
    const interaction = extractInteraction(html, page);
    pages.push({
      site: page.site,
      slug: page.slug,
      title: page.title,
      url: page.url,
      downloaded_path: path.relative(root, downloadedPath),
      local_clone_path: path.relative(root, localClonePath(page)),
      source_path: path.relative(root, sourcePath),
      ...interaction,
    });
  }

  const summary = {
    generated_at: new Date().toISOString(),
    page_count: pages.length,
    by_site: {},
    totals: {
      links: 0,
      buttons: 0,
      forms: 0,
      inputs: 0,
      videos: 0,
      details: 0,
      menu_triggers: 0,
    },
    links_by_kind: {},
  };

  for (const page of pages) {
    summary.by_site[page.site] = (summary.by_site[page.site] || 0) + 1;
    summary.totals.links += page.link_count;
    summary.totals.buttons += page.button_count;
    summary.totals.forms += page.form_count;
    summary.totals.inputs += page.input_count;
    summary.totals.videos += page.video_count;
    summary.totals.details += page.details_count;
    summary.totals.menu_triggers += page.menu_trigger_count;
    for (const [kind, count] of Object.entries(page.links_by_kind)) {
      summary.links_by_kind[kind] = (summary.links_by_kind[kind] || 0) + count;
    }
  }

  await fs.mkdir(path.dirname(reportJson), { recursive: true });
  await fs.writeFile(reportJson, `${JSON.stringify({ summary, pages }, null, 2)}\n`);

  const rows = [
    '# Public Interaction Inventory',
    '',
    `Generated: ${summary.generated_at}`,
    '',
    `- Pages: ${summary.page_count}`,
    `- Links: ${summary.totals.links}`,
    `- Buttons: ${summary.totals.buttons}`,
    `- Forms: ${summary.totals.forms}`,
    `- Inputs/selects/textareas: ${summary.totals.inputs}`,
    `- Videos: ${summary.totals.videos}`,
    `- Details accordions: ${summary.totals.details}`,
    `- Menu triggers: ${summary.totals.menu_triggers}`,
    '',
    '## Links By Kind',
    '',
    ...Object.entries(summary.links_by_kind).sort((a, b) => b[1] - a[1]).map(([kind, count]) => `- ${kind}: ${count}`),
    '',
    '## Pages With Public Front-End Controls',
    '',
    '| Site | Page | Links | Buttons | Forms | Inputs | Videos |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: |',
    ...pages
      .filter((page) => page.button_count || page.form_count || page.input_count || page.video_count)
      .map((page) => `| ${page.site} | ${page.slug} | ${page.link_count} | ${page.button_count} | ${page.form_count} | ${page.input_count} | ${page.video_count} |`),
  ];
  await fs.writeFile(reportMd, `${rows.join('\n')}\n`);

  console.log(JSON.stringify(summary, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
