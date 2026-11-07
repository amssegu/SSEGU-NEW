import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

assert.equal(existsSync('dist/index.html'), true, 'Build dist/index.html first');
assert.equal(existsSync('dist/smoke/index.html'), true, 'Build dist/smoke/index.html first');
for (const route of [
  'news/index.html',
  'category/business/index.html',
  'about/index.html',
  'contact/index.html',
  'privacy/index.html',
  'terms/index.html',
  'search/index.html',
  '404.html',
  'rss.xml',
  'sitemap-index.xml',
]) {
  assert.equal(existsSync(`dist/${route}`), true, `Build ${route} first`);
}
assert.match(readFileSync('dist/smoke/index.html', 'utf8'), /Smoke test passed/);
assert.match(readFileSync('dist/index.html', 'utf8'), /BREAKING NEWS/);
assert.match(readFileSync('dist/rss.xml', 'utf8'), /<rss/);
assert.match(readFileSync('dist/sitemap-index.xml', 'utf8'), /government-unveils-new-ict-strategy/);
assert.doesNotMatch(readFileSync('dist/index.html', 'utf8'), /work\.ssegu\.com|href="\/work\//i);
console.log('static smoke checks passed');
