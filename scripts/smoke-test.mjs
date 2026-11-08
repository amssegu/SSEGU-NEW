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
  'work/index.html',
  'work/jobs/index.html',
  'work/jobs/customer-experience-officer-mtn-uganda/index.html',
  'work/internships/index.html',
  'work/internships/ict-internship-kampala/index.html',
  'work/career-advice/index.html',
  'work/career-advice/how-to-write-a-winning-cv-in-uganda/index.html',
  'work/courses/index.html',
  'work/courses/digital-skills-foundation/index.html',
  'work/cv-resources/index.html',
  'work/cv-resources/cv-checklist/index.html',
  'work/employers/index.html',
  'work/submit-job/index.html',
]) {
  assert.equal(existsSync(`dist/${route}`), true, `Build ${route} first`);
}
assert.match(readFileSync('dist/smoke/index.html', 'utf8'), /Smoke test passed/);
assert.match(readFileSync('dist/index.html', 'utf8'), /BREAKING NEWS/);
assert.match(readFileSync('dist/rss.xml', 'utf8'), /<rss/);
assert.match(readFileSync('dist/sitemap-index.xml', 'utf8'), /government-unveils-new-ict-strategy/);
assert.match(readFileSync('dist/index.html', 'utf8'), /href="\/work\//i);
assert.match(readFileSync('dist/work/index.html', 'utf8'), /Your Career/);
assert.match(readFileSync('dist/work/jobs/index.html', 'utf8'), /Apply filters/);
assert.match(readFileSync('dist/work/jobs/index.html', 'utf8'), /Active opportunities/);
assert.doesNotMatch(readFileSync('dist/index.html', 'utf8'), /work\.ssegu\.com/i);
console.log('static smoke checks passed');
