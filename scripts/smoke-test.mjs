import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

assert.equal(existsSync('dist/index.html'), true, 'Build dist/index.html first');
assert.equal(existsSync('dist/smoke/index.html'), true, 'Build dist/smoke/index.html first');
const importedJobs = JSON.parse(readFileSync('src/data/snapshots/jobs.json', 'utf8'));
const importedCourses = JSON.parse(readFileSync('src/data/snapshots/courses.json', 'utf8'));
assert.ok(importedJobs.length > 0, 'jobs snapshot should contain imported listings');
const importedJob = importedJobs.find((job) => job.slug);
const importedCourse = importedCourses.find((course) => course.slug);
const today = new Date().toISOString().slice(0, 10);
const sitemapJob = importedJobs.find(
  (job) =>
    job.status === 'active' &&
    job.permissionType !== 'permission_required' &&
    !job.prohibitJobpostingSchema &&
    (!job.deadlineAt || job.deadlineAt.slice(0, 10) >= today),
);
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
  'sitemap-news.xml',
  'sitemap-work.xml',
  'work/rss.xml',
  'work/index.html',
  'work/jobs/index.html',
  `work/jobs/${importedJob.slug}/index.html`,
  'work/internships/index.html',
  'work/career-advice/index.html',
  'work/career-advice/how-to-write-a-winning-cv-in-uganda/index.html',
  'work/courses/index.html',
  'work/courses/page/2/index.html',
  'work/courses/categories/index.html',
  'work/courses/free/index.html',
  'work/courses/how-we-evaluate/index.html',
  'work/career-pathways/index.html',
  ...(importedCourses.length > 48 ? ['work/courses/page/2/index.html'] : []),
  ...(importedCourse ? [`work/courses/${importedCourse.slug}/index.html`] : []),
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
assert.match(readFileSync('dist/sitemap-index.xml', 'utf8'), /<sitemapindex/);
assert.match(readFileSync('dist/sitemap-index.xml', 'utf8'), /sitemap-news\.xml/);
assert.match(readFileSync('dist/sitemap-news.xml', 'utf8'), /government-unveils-new-ict-strategy/);
if (sitemapJob) {
  assert.match(readFileSync('dist/sitemap-work.xml', 'utf8'), new RegExp(sitemapJob.slug));
}
assert.match(readFileSync('dist/index.html', 'utf8'), /href="\/work\//i);
assert.match(readFileSync('dist/work/index.html', 'utf8'), /Your Career/);
assert.match(readFileSync('dist/work/jobs/index.html', 'utf8'), /Search jobs/);
assert.match(readFileSync('dist/work/jobs/index.html', 'utf8'), /Active opportunities/);
const courseIndex = readFileSync('dist/work/courses/index.html', 'utf8');
assert.match(courseIndex, /Search courses/);
assert.match(courseIndex, /Research status/);
if (importedCourses.length > 48) assert.match(courseIndex, /Next page/);
assert.ok(Buffer.byteLength(courseIndex) < 500_000, 'course index should stay reasonably small');
for (const slug of [
  'excel-skills-for-business-essentials',
  'google-data-analytics-professional-certificate',
  'who-academy-course-catalogue',
]) {
  assert.match(courseIndex, new RegExp(`/work/courses/${slug}/`));
}
const importedJobPage = readFileSync(`dist/work/jobs/${importedJob.slug}/index.html`, 'utf8');
assert.match(importedJobPage, new RegExp(importedJob.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
if (importedCourse) {
  const importedCoursePage = readFileSync(
    `dist/work/courses/${importedCourse.slug}/index.html`,
    'utf8',
  );
  assert.match(
    importedCoursePage,
    new RegExp(importedCourse.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  );
}
assert.match(readFileSync('dist/search/index.html', 'utf8'), /noindex, nofollow/);
assert.match(
  readFileSync('dist/government-unveils-new-ict-strategy-for-a-digital-uganda/index.html', 'utf8'),
  /og:title/,
);
assert.doesNotMatch(readFileSync('dist/index.html', 'utf8'), /work\.ssegu\.com/i);
console.log('static smoke checks passed');
