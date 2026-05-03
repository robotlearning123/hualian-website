import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourceAssets = path.join(root, 'downloaded-sites', '_assets', 'neuralink.com', 'assets');
const mirrorAssets = path.join(root, 'downloaded-sites', 'neuralink', 'neuralink.com', 'assets');
const preloadFiles = [
  path.join(sourceAssets, 'chunks', 'chunk-CIWYfOmV.js'),
  path.join(mirrorAssets, 'chunks', 'chunk-CIWYfOmV.js'),
];
const from = 'return"https://neuralink.com/"+i';
const to = 'return"/downloaded-sites/neuralink/neuralink.com/"+i';

const copyRecursive = async (src, dest) => {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  let copied = 0;
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copied += await copyRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
      copied += 1;
    }
  }
  return copied;
};

const patchPreloader = async (file) => {
  const text = await fs.readFile(file, 'utf8');
  if (!text.includes(from)) return { file: path.relative(root, file), changed: false };
  await fs.writeFile(file, text.replaceAll(from, to));
  return { file: path.relative(root, file), changed: true };
};

const main = async () => {
  const copiedFiles = await copyRecursive(sourceAssets, mirrorAssets);
  const patched = [];
  for (const file of preloadFiles) patched.push(await patchPreloader(file));
  const summary = { copiedFiles, patched };
  console.log(JSON.stringify(summary, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
