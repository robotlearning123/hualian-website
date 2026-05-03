import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url)).replace(/\/scripts$/, '');
const htmlFiles = ['index.html', 'neuralink.html', 'neuropixels.html'];
const missing = [];

const isExternal = (value) =>
  /^(https?:|mailto:|tel:|#|data:|javascript:)/i.test(value) || value === '';

for (const file of htmlFiles) {
  const path = join(root, file);
  if (!existsSync(path)) {
    missing.push(file);
    continue;
  }

  const html = readFileSync(path, 'utf8');
  const attrPattern = /\b(?:href|src|poster)=["']([^"']+)["']/g;
  for (const match of html.matchAll(attrPattern)) {
    const ref = match[1];
    if (isExternal(ref)) continue;
    const clean = ref.split(/[?#]/)[0];
    if (!existsSync(join(root, clean))) {
      missing.push(`${file} -> ${ref}`);
    }
  }
}

if (missing.length) {
  console.error('Missing local references:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('All local static references resolve.');
