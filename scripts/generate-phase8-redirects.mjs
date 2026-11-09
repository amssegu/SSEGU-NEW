import { readFile, writeFile } from 'node:fs/promises';

const source = 'docs/migration/phase-7/artifacts/redirects/dual-site-redirects.csv';
const target = 'public/_redirects';
const lines = (await readFile(source, 'utf8')).trim().split(/\r?\n/);
const rows = lines.slice(1).map((line) => line.split(','));

if (rows.some(([, , , , verified]) => verified !== 'true')) {
  throw new Error('Cannot generate deployment redirects from an unverified map');
}

const output = [
  '# Generated from the reviewed Phase 8 redirect map.',
  '# Cloudflare Pages preserves query strings for these exact-path rules.',
  ...rows.map(([, oldUrl, newUrl, redirectType]) => `${oldUrl} ${newUrl} ${redirectType}`),
  '',
].join('\n');
await writeFile(target, output);
console.log(`Generated ${rows.length} redirect rules in ${target}`);
