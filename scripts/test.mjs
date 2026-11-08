import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

assert.equal(existsSync('src/pages/index.astro'), true);
assert.equal(existsSync('src/pages/smoke.astro'), true);
assert.equal(existsSync('src/pages/[slug].astro'), true);
assert.equal(existsSync('src/pages/category/[slug].astro'), true);
assert.equal(existsSync('src/pages/work/index.astro'), true);
assert.equal(existsSync('src/pages/work/jobs/index.astro'), true);
assert.equal(existsSync('src/pages/work/jobs/[slug].astro'), true);
assert.equal(existsSync('src/layouts/WorkLayout.astro'), true);
assert.equal(existsSync('src/pages/rss.xml.ts'), true);
assert.equal(existsSync('src/pages/sitemap-index.xml.ts'), true);
assert.match(readFileSync('astro.config.mjs', 'utf8'), /output:\s*'static'/);
assert.match(readFileSync('src/layouts/MainLayout.astro', 'utf8'), /href="\/work\/"/);
assert.doesNotMatch(readFileSync('src/layouts/MainLayout.astro', 'utf8'), /work\.ssegu\.com/i);
console.log('unit checks passed');
