import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const marker = '<script id="public-clone-local-click-routing">';
const reportJson = path.join(root, 'docs', 'reports', 'local-click-routing-report.json');
const reportMd = path.join(root, 'docs', 'reports', 'local-click-routing-report.md');

const routingScript = `${marker}
(function () {
  function siteForCurrentPage() {
    var pathname = location.pathname;
    if (pathname.indexOf('/downloaded-sites/neuralink/neuralink.com/') !== -1) return 'neuralink';
    if (pathname.indexOf('/downloaded-sites/neuropixels/www.neuropixels.org/') !== -1) return 'neuropixels';
    return '';
  }

  function localTargetForHref(value) {
    if (!value || value.charAt(0) === '#' || value.indexOf('mailto:') === 0 || value.indexOf('tel:') === 0 || value.indexOf('javascript:') === 0) return '';
    var site = siteForCurrentPage();
    var url;
    try {
      url = new URL(value, location.href);
    } catch (error) {
      return '';
    }

    var pathname = decodeURIComponent(url.pathname);
    var searchAndHash = url.search + url.hash;
    var isLocalRelativePage = url.hostname === location.hostname && pathname.indexOf('/downloaded-sites/') !== 0;

    if (url.hostname === 'neuralink.com' || (site === 'neuralink' && isLocalRelativePage)) {
      if (pathname.indexOf('/blog/') === 0) {
        var updatePath = pathname.replace(/^\\/blog\\//, '/updates/');
        updatePath = updatePath.charAt(updatePath.length - 1) === '/' ? updatePath : updatePath + '/';
        return '/downloaded-sites/neuralink/neuralink.com' + updatePath + 'index.html' + searchAndHash;
      }
      if (pathname === '/patient-registry' || pathname.indexOf('/patient-registry/') === 0) {
        return '/downloaded-sites/neuralink/neuralink.com/trials/index.html' + searchAndHash;
      }
      if (pathname === '/' || pathname === '') return '/downloaded-sites/neuralink/neuralink.com/index.html' + searchAndHash;
      if (/\\.pdf$/i.test(pathname)) return '/downloaded-sites/_assets/neuralink.com' + pathname + searchAndHash;
      var neuralinkPath = pathname.charAt(pathname.length - 1) === '/' ? pathname : pathname + '/';
      return '/downloaded-sites/neuralink/neuralink.com' + neuralinkPath + 'index.html' + searchAndHash;
    }

    if (url.hostname === 'www.neuropixels.org' || (site === 'neuropixels' && isLocalRelativePage)) {
      if (pathname === '/' || pathname === '') return '/downloaded-sites/neuropixels/www.neuropixels.org/index.html' + searchAndHash;
      if (/\\.(pdf|zip|xlsx?)$/i.test(pathname)) return url.href;
      var neuropixelsPath = pathname.charAt(pathname.length - 1) === '/' ? pathname.slice(0, -1) : pathname;
      return '/downloaded-sites/neuropixels/www.neuropixels.org' + neuropixelsPath + '.html' + searchAndHash;
    }

    return '';
  }

  function rewriteLinks(scope) {
    var root = scope || document;
    var links = root.querySelectorAll ? root.querySelectorAll('a[href]') : [];
    for (var i = 0; i < links.length; i += 1) {
      var local = localTargetForHref(links[i].getAttribute('href'));
      if (local) links[i].setAttribute('href', local);
    }
  }

  function protectForms(scope) {
    var root = scope || document;
    var forms = root.querySelectorAll ? root.querySelectorAll('form') : [];
    for (var i = 0; i < forms.length; i += 1) {
      forms[i].setAttribute('data-public-clone-local-form', 'true');
      forms[i].setAttribute('action', '#');
    }
  }

  document.addEventListener('click', function (event) {
    var anchor = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!anchor) return;
    var local = localTargetForHref(anchor.getAttribute('href'));
    if (!local) return;
    event.preventDefault();
    location.href = local;
  }, true);

  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!form || form.tagName !== 'FORM') return;
    form.setAttribute('data-public-clone-submit-prevented', 'true');
    event.preventDefault();
  }, true);

  function apply() {
    rewriteLinks(document);
    protectForms(document);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
  else apply();

  new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i += 1) {
      for (var j = 0; j < records[i].addedNodes.length; j += 1) {
        var node = records[i].addedNodes[j];
        if (node && node.nodeType === 1) {
          rewriteLinks(node);
          protectForms(node);
        }
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
}());
</script>`;

const walk = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(fullPath);
  }
  return files;
};

const htmlFiles = [
  ...await walk(path.join(root, 'downloaded-sites', 'neuralink', 'neuralink.com')),
  ...await walk(path.join(root, 'downloaded-sites', 'neuropixels', 'www.neuropixels.org')),
];

const changed = [];
for (const file of htmlFiles) {
  const html = await fs.readFile(file, 'utf8');
  let next = html;
  if (html.includes(marker)) {
    next = html.replace(/<script id="public-clone-local-click-routing">[\s\S]*?<\/script>/, routingScript);
  } else if (html.includes('</body>')) {
    next = html.replace('</body>', `${routingScript}\n</body>`);
  } else {
    next = `${html}\n${routingScript}\n`;
  }
  if (next === html) continue;
  await fs.writeFile(file, next);
  changed.push(path.relative(root, file));
}

const report = {
  generated_at: new Date().toISOString(),
  scanned_file_count: htmlFiles.length,
  changed_file_count: changed.length,
  changed,
};

await fs.mkdir(path.dirname(reportJson), { recursive: true });
await fs.writeFile(reportJson, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(reportMd, `# Local Click Routing Report

Generated: ${report.generated_at}

- Scanned files: ${report.scanned_file_count}
- Changed files: ${report.changed_file_count}

${changed.map((file) => `- ${file}`).join('\n')}
`);

console.log(JSON.stringify(report, null, 2));
