import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

assert.equal(existsSync('src/pages/index.astro'), true);
assert.equal(existsSync('src/pages/smoke.astro'), true);
assert.equal(existsSync('src/pages/[slug].astro'), true);
assert.equal(existsSync('src/pages/category/[slug].astro'), true);
assert.equal(existsSync('src/pages/news/page/[page].astro'), true);
assert.equal(existsSync('src/pages/category/[slug]/page/[page].astro'), true);
assert.equal(existsSync('src/components/main/Pagination.astro'), true);
assert.equal(existsSync('src/pages/work/career-advice/page/[page].astro'), true);
assert.equal(existsSync('src/pages/work/index.astro'), true);
assert.equal(existsSync('src/pages/work/jobs/index.astro'), true);
assert.equal(existsSync('src/pages/work/jobs/[slug].astro'), true);
assert.equal(existsSync('src/pages/work/submit-job/index.astro'), true);
assert.equal(existsSync('functions/api/job-submissions.ts'), true);
assert.equal(existsSync('migrations/d1/0001_create_job_submissions.sql'), true);
assert.equal(existsSync('scripts/phase7-migration.mjs'), true);
assert.equal(existsSync('src/layouts/WorkLayout.astro'), true);
assert.equal(existsSync('src/pages/rss.xml.ts'), true);
assert.equal(existsSync('src/pages/sitemap-index.xml.ts'), true);
assert.match(readFileSync('astro.config.mjs', 'utf8'), /output:\s*'static'/);
assert.match(readFileSync('src/layouts/MainLayout.astro', 'utf8'), /href="\/work\/"/);
assert.doesNotMatch(readFileSync('src/layouts/MainLayout.astro', 'utf8'), /work\.ssegu\.com/i);
assert.match(
  readFileSync('src/pages/work/submit-job/index.astro', 'utf8'),
  /action="\/api\/job-submissions"/,
);
assert.match(readFileSync('functions/api/job-submissions.ts', 'utf8'), /TURNSTILE_SECRET_KEY/);
assert.match(readFileSync('functions/api/job-submissions.ts', 'utf8'), /RATE_LIMIT_KV/);
assert.match(readFileSync('functions/api/job-submissions.ts', 'utf8'), /JOB_SUBMISSIONS_DB/);
assert.match(readFileSync('src/lib/articles.ts', 'utf8'), /slice\(0, 3\)/);
assert.match(readFileSync('src/pages/index.astro', 'utf8'), /stories\.slice\(5, 17\)/);
assert.match(readFileSync('src/pages/work/index.astro', 'utf8'), /workArticles\.slice\(0, 6\)/);
assert.match(readFileSync('src/lib/work.ts', 'utf8'), /slice\(0, 3\)/);
assert.match(readFileSync('src/lib/work-automation-mode.ts', 'utf8'), /'disabled'/);
assert.match(readFileSync('src/lib/work-automation-mode.ts', 'utf8'), /import\.meta\.env\.PROD/);
console.log('unit checks passed');
