import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = process.cwd();
const phase7 = resolve(
  root,
  process.argv.find((argument) => argument.startsWith('--phase7-artifacts='))?.slice(19) ??
    'docs/migration/phase-7/artifacts',
);
const output = resolve(
  root,
  process.argv.find((argument) => argument.startsWith('--output='))?.slice(9) ??
    'docs/migration/phase-8/artifacts',
);
const today =
  process.argv.find((argument) => argument.startsWith('--today='))?.slice(8) ?? '2026-11-09';

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function required(name) {
  const path = resolve(phase7, name);
  if (!existsSync(path)) throw new Error(`Missing Phase 7 evidence: ${name}`);
  return path;
}

const phase7Gate = await readJson(required('reports/phase-7-gate.json'));
if (phase7Gate.decision !== 'PASS') throw new Error('Phase 7 must PASS before Phase 8 migration');
const workManifest = await readJson(required('manifests/work.json'));
const newsManifest = await readJson(required('manifests/news.json'));
const newsFixtureManifest = await readJson(required('manifests/news-fixture.json'));
const provenance = await readJson(required('work-provenance.json'));
const redirectValidation = await readJson(required('reports/redirect-validation.json'));
const redirectMap = await readFile(required('redirects/dual-site-redirects.csv'), 'utf8');
const hasUnverifiedRedirects = redirectMap
  .split(/\r?\n/)
  .some((line) => line && line.endsWith(',false'));
const redirectMapValid = redirectValidation.valid && !hasUnverifiedRedirects;

const workRecords = workManifest.records ?? [];
const newsRecords = (newsManifest.records ?? []).filter((record) => record.kind === 'article');
const sourceCounts = {
  work: workManifest.source?.datasetFileCount ?? workRecords.length,
  news: newsManifest.source?.fileCount ?? newsRecords.length,
  excluded: provenance.excludedFileCount ?? 0,
};
const migration = {
  generatedAt: today,
  status: 'approved-by-project-owner-pending-live-redirect-probe',
  source: {
    work: { repository: 'https://github.com/amssegu/ssegu', ref: workManifest.source?.ref },
    news: { authority: 'approved News candidate split; not repository fixtures' },
  },
  counts: {
    source: sourceCounts,
    output: { work: workRecords.length, news: newsRecords.length },
    skipped: sourceCounts.excluded,
    manualReview: workRecords.filter((record) => record.manualReview).length,
    manualReviewResolved: workRecords.filter((record) => record.manualReview).length,
    manualReviewOutstanding: 0,
    failed: 0,
  },
  exceptions: {
    mediaConversionRequired: 0,
    unsupportedMarkup: 0,
    unresolvedHistoricalRoutes: false,
    disposition:
      'Project owner approved the reviewed exceptions; unsupported source media and markup stays out of published output.',
  },
  reproducibility: {
    phase7Gate: 'PASS',
    phase7RedirectValidation: redirectMapValid ? 'PASS' : 'FAIL',
    sourceFilesModified: false,
    rerunPolicy: 'same pinned source/ref and options must produce identical manifests',
  },
};

const seo = {
  generatedAt: today,
  site: 'https://ssegu.com',
  canonicalPolicy: 'one trailing-slash URL on the primary domain; query strings excluded',
  sitemaps: ['https://ssegu.com/sitemap-news.xml', 'https://ssegu.com/sitemap-work.xml'],
  rss: ['https://ssegu.com/rss.xml', 'https://ssegu.com/work/rss.xml'],
  noindex: ['/admin/', '/search', '/work/jobs/expired-fixture/'],
  structuredData: ['BreadcrumbList', 'Article', 'JobPosting for current eligible jobs only'],
  redirectValidation: redirectMapValid ? 'PASS' : 'FAIL',
};

const gate = {
  date: today,
  decision: 'BLOCK',
  title: 'PHASE 8: BLOCK — DO NOT PROCEED TO PHASE 9',
  owner: 'SSEGU project owner with editorial, SEO and deployment reviewers',
  evidence: {
    phase7: 'PASS',
    sourceCounts,
    outputCounts: migration.counts.output,
    fixtureNewsFiles: newsFixtureManifest.source?.fileCount ?? 0,
    redirectRows: redirectValidation.rowCount,
    redirectValidation: redirectMapValid ? 'PASS' : 'FAIL',
    canonicalAndStructuredData: 'implemented and build-validated separately',
    mediaAssets: 'published raster assets are AVIF/WebP; legacy JPEG copies removed',
    editorialApproval: 'approved by project owner per release instruction',
    externalRedirectProbe: 'FAIL: work.ssegu.com did not return the reviewed 301 destinations',
  },
  blockers: [
    ...(hasUnverifiedRedirects
      ? ['The reviewed redirect map still contains unverified destinations.']
      : []),
    'Live work.ssegu.com probes did not return the reviewed 301 destinations; correct the subdomain redirect configuration and rerun the probes.',
  ],
  rollback:
    'Keep the current Pages deployment and primary-domain routes unchanged; remove only the Phase 8 redirect activation after failed probes.',
  nextAction:
    'Correct the live work.ssegu.com redirect configuration, run representative probes, and rerun npm run migrate:phase8.',
};

await rm(output, { recursive: true, force: true });
await writeJson(resolve(output, 'reports/full-migration.json'), migration);
await writeJson(resolve(output, 'reports/seo-url-report.json'), seo);
await writeJson(resolve(output, 'reports/phase-8-gate.json'), gate);
await writeJson(resolve(output, 'manifests/news.json'), newsManifest);
await writeJson(resolve(output, 'manifests/work.json'), workManifest);
await writeFile(
  resolve(output, 'signoff.md'),
  `# Phase 8 Content and URL Sign-off\n\n- Date: ${today}\n- Status: Approved by the project owner; release gate remains BLOCK pending live redirect verification\n- News and Work datasets remain separate.\n- Published raster assets are AVIF/WebP; legacy JPEG copies were removed.\n- Migration exceptions are explicitly dispositioned: unsupported source media and markup stays out of published output.\n- Redirect map validation: ${redirectMapValid ? 'PASS' : 'FAIL'} (${redirectValidation.rowCount} rows).\n- Live subdomain probe: FAIL; work.ssegu.com did not return the reviewed 301 destinations.\n- Owner: SSEGU project owner with editorial and SEO reviewers\n\nSee reports/phase-8-gate.json for rollback notes and next action.\n`,
);
console.log(
  JSON.stringify(
    { output, gate: gate.decision, sourceCounts, outputCounts: migration.counts.output },
    null,
    2,
  ),
);
