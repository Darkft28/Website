// Prérequis : npm i -D sharp   puis   node scripts/optimize-images.mjs
import sharp from 'sharp';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = 'assets/img';
const RULES = [
  { match: /\/avis\//,  width: 160,  quality: 80 },
  { match: /.*/,        width: 1600, quality: 80 },
];

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (/\.(png|jpe?g)$/i.test(e.name)) out.push(p);
  }
  return out;
}

for (const file of await walk(ROOT)) {
  const rule = RULES.find(r => r.match.test(file.replace(/\\/g, '/')));
  const out = file.replace(/\.(png|jpe?g)$/i, '.webp');
  const img = sharp(file);
  const meta = await img.metadata();
  const pipeline = rule.width && meta.width > rule.width
    ? img.resize({ width: rule.width, withoutEnlargement: true })
    : img;
  await pipeline.webp({ quality: rule.quality }).toFile(out);
  const before = (await stat(file)).size, after = (await stat(out)).size;
  console.log(`${out}  ${(before/1024)|0}Ko → ${(after/1024)|0}Ko`);
}
