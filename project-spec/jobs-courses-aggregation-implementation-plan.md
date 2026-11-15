# Jobs and Courses Aggregation — Astro Work Integration Plan

**Repository:** SSEGU-NEW  
**Related specifications:** `project-spec/jobs-courses-aggregation-spec-astro.md`, `project-spec/sources.txt`  
**Prepared:** 15 November 2026  
**Status:** Implementation plan; no application code is changed by this document

## 1. Goal

Add approved, refreshable job and course aggregation to the existing SSEGU Work section while preserving the current Astro static site, `/work/` URL boundary, editorial content workflow, employer-submission workflow, and existing page behaviour.

The finished system will:

- ingest only approved source metadata through isolated adapters;
- store canonical structured records in Cloudflare D1;
- export a validated, deterministic public dataset before `astro build`;
- generate static listing and detail pages at `/work/jobs/` and `/work/courses/`;
- retain existing manually authored Work records and fixture routes during migration;
- preserve source attribution and original application/enrolment links;
- handle expiry, withdrawals, stale course records and source outages safely;
- refresh jobs at most twice daily and courses at most twice weekly;
- deploy only when the public dataset changes;
- keep ordinary visitor requests free of D1 queries and Worker calls.

The implementation must not create root-level `/jobs` or `/courses` routes, migrate to Next.js, turn D1 into a request-time CMS, or mix imported records into News articles.

## 2. Repository findings and constraints

### Existing implementation

- Astro is already configured for static output in `astro.config.mjs:5`.
- The Work shell and navigation are in `src/layouts/WorkLayout.astro`.
- Stable routes already exist under `src/pages/work/` for jobs, courses, internships, career advice, CV resources, employers and submissions.
- `src/lib/work.ts` currently owns hard-coded `workJobs`, `workCourses`, internships, CV resources and Work article accessors.
- `src/pages/work/jobs/index.astro` performs client-side filtering by serialising the job array into inline JavaScript.
- `src/pages/work/jobs/[slug].astro` generates static job pages and conditionally emits `JobPosting` JSON-LD.
- Course routes currently render the small hard-coded `workCourses` fixture array and show a disabled access button.
- `src/content.config.ts` already defines editorial `jobs`, `internships` and `courses` collections. These schemas are suitable for manually curated records but are not a complete representation of the aggregation model.
- `src/content/jobs/phase-5-job-fixture.md`, `src/content/internships/phase-5-internship-fixture.md` and `src/content/courses/phase-5-course-fixture.md` are draft fixtures and must not become public listings accidentally.
- `src/pages/sitemap-work.xml.ts` currently derives URLs from hard-coded arrays and excludes expired jobs from detail URLs.
- `src/pages/work/rss.xml.ts` currently publishes Work articles only.
- `migrations/d1/0001_create_job_submissions.sql` and `functions/api/job-submissions.ts` use D1/KV for the separate employer submission queue. This binding and table must remain intact.
- `.github/workflows/ci.yml` runs formatting, Astro checks, tests, content validation, build and smoke tests, but no ingestion workflow currently exists.
- `wrangler.toml` has a D1 binding named `JOB_SUBMISSIONS_DB`; it is not yet an aggregation database binding.

### Baseline verification

- `npm test` passes (`unit checks passed`).
- `npm run check` currently terminates with a segmentation fault in the installed Astro checker. This must be reproduced and isolated before relying on it as a release gate; do not treat the crash as evidence that the new implementation is valid.
- The working tree contains the two user-supplied specification files as untracked files. The implementation should avoid overwriting either file.

### Important design decision

Use a separate imported-record model and D1 tables, then map both imported records and approved editorial records into shared Work view models. Do not force D1 records into Astro Content Collections or use the existing `jobs`/`courses` collections as a second database.

During rollout, the route layer should support this precedence:

1. valid imported records from the generated D1 export;
2. published editorial records already managed by the repository;
3. existing fixture arrays only as an explicit local/build fallback while the migration is being staged.

The fallback must be observable and removable; it must not silently publish draft fixtures.

## 3. Target architecture

```text
Approved RSS/API/manual catalogue
        |
        v
GitHub Actions scheduled workflow
        |
        v
adapter -> validate -> normalise -> permission rules -> deduplicate
        |
        v
Cloudflare D1 aggregation database
        |
        v
export active/publishable records + validate deterministic JSON
        |
        v
Astro static build: /work/jobs/, /work/courses/
        |
        v
Cloudflare Pages static output
```

The existing Pages Function D1 binding for job submissions remains a separate concern. If the project uses one D1 database for both concerns later, use distinct tables and migration ownership; do not change the submission API contract as part of this feature.

## 4. Implementation phases

### Phase 0 — Preflight and source approval

1. Confirm the active Cloudflare Pages project, Pages deployment owner and current Wrangler version.
2. Confirm whether GitHub Actions or Pages Git integration currently deploys production. Select one owner before adding scheduled deployment.
3. Verify current free-tier limits and current official source terms at implementation time.
4. Create a source permission register from `project-spec/sources.txt`; store terms URL, review date, allowed fields, attribution, rate limits and source-specific restrictions.
5. Keep every unapproved source disabled. Candidate order is:
   - JubaJobs jobs feed;
   - selected YubHub feeds;
   - Remote OK;
   - ReliefWeb after approved `appname` access;
   - Himalayas only after its application-link, expiry and no-`JobPosting` rules are enforced;
   - small link-only course catalogue for Saylor, MIT OCW, OpenLearn and freeCodeCamp;
   - OER Commons only after a permitted documented access method is confirmed.
6. Establish a fixture-only local mode for development so contributors can build the Work section without production credentials.

**Exit gate:** no adapter can be enabled without a recorded permission decision and a sample payload test.

### Phase 1 — Aggregation data contract and D1 migration

Create a versioned migration, recommended as `migrations/d1/0002_create_work_aggregation.sql`, containing:

- `content_sources` with source type, endpoints, permission classification, terms and attribution, enabled state, review metadata and source-specific restriction flags;
- `jobs` with source identity, original/application URLs, title, employer, location, country, category, employment type, work mode, permitted excerpt, salary text/currency/period, publication/deadline timestamps, first/last seen timestamps, status, permission type and content hash;
- `courses` with source identity, original/enrolment URLs, title, provider, summary, subject, level, delivery mode, language, duration, course price status, certificate price status, availability status, first/last seen timestamps and content hash;
- `ingestion_runs` with source, content type, timestamps, result, counts and bounded error summary;
- `listing_status_history` for evidence-based status transitions.

Use explicit checks/enums for status values. Add uniqueness and indexes for source identity, canonical URL/fingerprint, slug, active status, dates, location/category/work mode, subject and provider. Do not make title similarity alone a merge key.

Keep the migration compatible with the existing submission migration. Do not rename `JOB_SUBMISSIONS_DB`, remove its tables or alter its API.

Recommended source flags include `requires_appname`, `requires_api_key`, `must_use_source_application_link`, `prohibit_jobposting_schema`, `remove_when_expired`, `commercial_reuse_allowed` and `manual_review_required`.

**Exit gate:** migration applies to a disposable/local D1 database and leaves existing submission behaviour unchanged.

### Phase 2 — Shared ingestion library and first job source

Add a small, dependency-light ingestion subsystem under `scripts/aggregation/` or `src/lib/aggregation/` with these boundaries:

- `types.ts`: raw adapter output, normalised job/course records, source configuration and run result types;
- `http.ts`: timeout, response-size limit, descriptive user-agent, bounded retry/backoff and safe error handling;
- `normalise.ts`: canonical URLs, text cleanup, date/timezone handling, slug generation, enum mapping and URL-scheme validation;
- `validate.ts`: required-field and permission-field checks; quarantine malformed records;
- `deduplicate.ts`: stable source ID, canonical URL, then source-specific fingerprint;
- `policy.ts`: refresh-frequency enforcement, source enablement and source restriction checks;
- `adapters/jubajobs.ts`: first end-to-end adapter, enabled only after live terms/feed confirmation;
- `db.ts`: prepared D1 statements/upserts, status-history writes and run logging;
- `run-jobs.ts`: orchestration for all enabled job adapters without deleting records on partial failure;
- `run-courses.ts`: separate course orchestration and schedule policy.

The ingestion layer must distinguish fetch failure, empty-but-valid response, malformed response and valid disappearance. A failed source request never expires or deletes its prior records. A temporarily omitted field must not overwrite a known value with null. Expiry requires a deadline or other documented reliable evidence.

Implement JubaJobs first because the source register identifies a regional feed pathway. Preserve the original listing URL, attribution and required backlink. Do not add tenders or training feeds until their taxonomy and permissions are separately approved.

**Exit gate:** sample records are normalised, stored, deduplicated, attributed and recoverable after a simulated failed fetch.

### Phase 3 — Build-time export and route data adapter

Add a prebuild export command, for example `scripts/export-work-data.mjs`, that:

1. authenticates with a narrowly scoped GitHub Actions/Cloudflare credential;
2. queries only approved publishable records from D1;
3. excludes suppressed, malformed and non-publishable records;
4. writes deterministic JSON to an ephemeral generated-data directory;
5. validates the export schema, unique slugs and safe URLs;
6. writes a small manifest containing dataset hash, counts and export timestamp;
7. never logs credentials or includes private fields.

Use a stable generated-data contract, recommended as `jobs.json`, `courses.json` and `manifest.json`. Keep generated output out of hand-edited content and preferably out of git. For local builds with no D1 credentials, use a clearly labelled fixture export or empty dataset with the existing published editorial data still available.

Refactor `src/lib/work.ts` into a compatibility/data-access layer. Preserve the existing public helper names where practical, but add explicit functions such as:

- `getPublishedWorkJobs()`;
- `getPublishedWorkCourses()`;
- `getWorkJobBySlug()` and `getWorkCourseBySlug()`;
- `isPublishableJob()` / `isPublishableCourse()`;
- `getJobFilterOptions()` / `getCourseFilterOptions()`;
- mapping functions from imported records and editorial collection entries to shared view models.

The route layer must not import D1 clients or fetch remote sources. It should import only the generated build data and repository content.

**Exit gate:** a local build can consume deterministic generated data, and an export with no records does not crash the Work section.

### Phase 4 — Jobs UI integration and expiry behaviour

Update the existing Work jobs routes/components rather than creating parallel pages:

- `src/pages/work/jobs/index.astro`: render active jobs by default, include expired only when explicitly requested, derive filter options from data, and keep filtering client-side only while dataset size is small. Add noindex/canonical handling for query-state pages if needed.
- `src/pages/work/jobs/[slug].astro`: render source attribution, original/application link, publication/deadline data, salary only when supplied, and status-specific messaging. Keep expired pages 200 only when they retain useful reference value; remove application CTA for expired/withdrawn/unverified listings.
- `src/components/work/WorkJobCard.astro`: support imported metadata, attribution/status, missing optional values and source-safe links without changing existing card URLs.
- Add `src/components/work/ExpiredNotice.astro`, `SourceAttribution.astro` and, if useful, shared `WorkBreadcrumbs.astro` to prevent duplicated status/link rules.
- Update `src/pages/work/index.astro` so latest jobs come from the shared accessor and the homepage search/location options do not assume only Kampala/Remote.
- Keep `/work/internships/` separate. Imported internships may be classified only through an explicit taxonomy decision; do not silently route every job with `employmentType=internship` into the existing internship collection.

`JobPosting` JSON-LD must be emitted only for genuine current jobs with complete, visible matching data and only when the source policy permits it. In particular, Himalayas records must never receive `JobPosting` markup. Expired, withdrawn and unverified jobs must not receive active markup.

**Exit gate:** current, expired, withdrawn, unverified and missing-deadline cases each render correctly and have correct sitemap/structured-data behaviour.

### Phase 5 — More job adapters and controlled scheduling

Implement adapters one at a time, with a source-specific test fixture and permission record:

- YubHub selected Uganda/East Africa/graduate or industry feeds, preserving required attribution;
- Remote OK for remote roles, preserving credit and original links;
- ReliefWeb only after approved `appname`, terms and publisher attribution are recorded;
- Himalayas only with unchanged `applicationLink`, expiry removal rules, salary-period handling and an enforced no-`JobPosting` flag.

Add `.github/workflows/aggregate-jobs.yml` with:

- schedules at `15 3 * * *` and `15 15 * * *` UTC;
- `workflow_dispatch` marked exceptional/manual in logs;
- concurrency cancellation or queueing to prevent overlapping runs;
- least-privilege permissions;
- bounded retries and per-source outcomes;
- D1 update and public-dataset hash comparison;
- one export/build/deploy after the complete batch only when public data changed.

Do not deploy once per source. A failed source must be visible without blocking successful source updates or wiping prior data.

**Exit gate:** two scheduled job windows cannot overlap, and a no-change run makes no deployment.

### Phase 6 — Courses as a link-only catalogue first

Extend the course model and UI for factual catalogue metadata only. Add fields that the current `src/content.config.ts` course schema does not have, including subject, level, language, course price status, certificate price status, availability status, source terms URL, attribution and last checked date.

Start with manually curated or permitted metadata/link records for Saylor, MIT OCW, OpenLearn and freeCodeCamp. Do not copy lessons, videos, readings, images or full descriptions. Label MIT/OpenLearn offerings accurately and do not imply affiliation, accreditation, academic credit or free certificates. Keep course access price separate from certificate price.

Update:

- `src/pages/work/courses/index.astro` with useful filters for subject, provider, level, delivery mode, price and certificate status;
- `src/pages/work/courses/[slug].astro` with provider/source attribution, verified metadata, last-checked date, separate price labels and a direct enrolment/provider link;
- a new `src/components/work/WorkCourseCard.astro` for consistent cards and safe optional fields;
- `src/lib/work.ts` course accessors and filter-option derivation;
- course JSON-LD only when the visible page genuinely supports the chosen schema and all fields are accurate.

Add `.github/workflows/aggregate-courses.yml` with `0 4 * * 2,5` UTC, concurrency protection, source-level outcomes and no-change deployment suppression. If a course source cannot be checked reliably, mark it `unverified` rather than claiming current availability.

**Exit gate:** a link-only course page never renders copied provider material or an unsupported “free certificate” claim.

### Phase 7 — Sitemap, RSS, SEO and navigation integration

Update `src/pages/sitemap-work.xml.ts` to consume shared publishability rules:

- include Work index/listing pages and only canonical publishable detail pages;
- include active job pages and eligible course pages;
- exclude suppressed/malformed records and active-job markup candidates that are no longer current;
- include retained expired pages only when the product policy marks them useful and indexable;
- keep query-string filter states out of the sitemap.

Update `src/pages/work/rss.xml.ts` only if the product wants job/course feed items; if so, include attribution and canonical detail links and do not expose source-restricted fields. Otherwise leave the article RSS contract unchanged and document that choice.

Add breadcrumb JSON-LD to course detail pages and ensure job/course canonical URLs remain under `/work/`. Check `public/_redirects` and existing route governance before adding any redirect for a changed slug.

**Exit gate:** sitemap URLs, canonical tags, page headings, visible status and structured data agree for every record type.

### Phase 8 — Validation, rollout and operations

Extend CI and scripts with deterministic checks:

- `scripts/test-aggregation.mjs` for adapters, normalisation, date handling, URL safety, deduplication, outage retention, expiry and source restrictions;
- `scripts/validate-work-export.mjs` for generated JSON schema, unique IDs/slugs, allowed statuses and no private fields;
- fixture payloads under `project-spec/content-fixtures/aggregation/` for valid, malformed, duplicate, empty, failed and source-restricted responses;
- CI steps for aggregation unit tests, export validation and a fixture-only static build;
- smoke checks for `/work/`, `/work/jobs/`, active/expired job detail, `/work/courses/`, course detail, sitemap and no accidental root-level routes.

Roll out behind a staged enablement flag:

1. run adapters in report-only mode;
2. compare counts, duplicate reports, source attribution and generated routes with expected samples;
3. enable one job source in D1;
4. verify one complete scheduled run and one failure run;
5. enable additional sources one at a time;
6. enable the course catalogue separately;
7. remove fixture fallback only after published-data parity and rollback evidence.

Document D1 export/backup, source disablement, last-known-good retention, deployment rollback and how to remove a source or listing on rights-holder request.

## 5. Files to create or modify

### Create

- `migrations/d1/0002_create_work_aggregation.sql`
- `scripts/aggregation/types.ts`
- `scripts/aggregation/http.ts`
- `scripts/aggregation/normalise.ts`
- `scripts/aggregation/validate.ts`
- `scripts/aggregation/deduplicate.ts`
- `scripts/aggregation/policy.ts`
- `scripts/aggregation/db.ts`
- `scripts/aggregation/adapters/jubajobs.ts` and subsequent source adapters
- `scripts/run-jobs.mjs`
- `scripts/run-courses.mjs`
- `scripts/export-work-data.mjs`
- `scripts/validate-work-export.mjs`
- `src/components/work/WorkCourseCard.astro`
- `src/components/work/ExpiredNotice.astro`
- `src/components/work/SourceAttribution.astro`
- `.github/workflows/aggregate-jobs.yml`
- `.github/workflows/aggregate-courses.yml`
- aggregation payload/test fixtures and a short operations runbook

### Modify

- `src/lib/work.ts`
- `src/content.config.ts` only if editorial schemas need non-breaking optional fields or clearer separation from imported records
- `src/pages/work/index.astro`
- `src/pages/work/jobs/index.astro`
- `src/pages/work/jobs/[slug].astro`
- `src/pages/work/courses/index.astro`
- `src/pages/work/courses/[slug].astro`
- `src/components/work/WorkJobCard.astro`
- `src/pages/sitemap-work.xml.ts`
- `src/pages/work/rss.xml.ts` only by an explicit RSS decision
- `wrangler.toml` for a separate/approved aggregation D1 binding
- `package.json` for scripts only; avoid adding dependencies unless the native platform APIs are insufficient
- `scripts/test.mjs`, `scripts/validate-content.mjs`, `scripts/smoke-test.mjs` and `.github/workflows/ci.yml`
- `.gitignore` for ephemeral generated data, if not already covered

### Do not modify as part of this feature

- News article collections/routes and main-site article behaviour;
- `functions/api/job-submissions.ts` request contract;
- `migrations/d1/0001_create_job_submissions.sql`;
- `src/pages/work/submit-job/index.astro`, except for unrelated integration-safe links;
- existing `/work/` route paths or the static output mode;
- user-supplied specification files.

## 6. Data and rendering rules

### Jobs

Required before publication: recognisable title, source URL, employer/hiring organisation where available, and usable application destination or clear instructions. Preserve source ID and URL. Use stable slugs; if a published slug must change, create a verified permanent redirect.

Active job detail pages may show an application CTA and `JobPosting` only when current, verified and source-permitted. Expired pages show a prominent notice, retain meaningful reference information, remove the active CTA and do not imply applications remain open. Unverified records are not presented as active vacancies.

### Courses

Required before publication: title, provider, source URL and a reliable indication of what the visitor can study. Treat all price/certificate fields as unknown until verified. Use direct provider links. Do not mirror course content. Do not call a course accredited, university-credit bearing or certificate-free without source evidence.

### Filters

Keep filter state client-side for the first release. Derive options from the dataset rather than hard-coding Kampala, Remote or a fixed provider list. Query-string filter states must be canonical/noindex or otherwise excluded from discovery. If the public JSON becomes too large, paginate/split before adding a Worker search endpoint.

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Existing hard-coded arrays are replaced too early | Add a shared accessor and staged generated-data fallback; preserve routes and fixture coverage until parity is proven. |
| Editorial collections and D1 publish duplicate slugs | Define source-aware IDs, a single precedence rule and duplicate-slug validation before build. |
| Source outage expires valid records | Persist last-known-good data; reconcile disappearance only with reliable evidence. |
| Terms change or commercial reuse is not allowed | Store permission review metadata and disable a source without deleting unrelated data. Start courses as link-only. |
| Himalayas restrictions leak into generic job rendering | Store explicit source flags and enforce them in both page rendering and JSON-LD generation. |
| D1 submissions are broken by a new database binding/migration | Keep submission schema/API isolated and test the existing endpoint on every CI run. |
| Static build output grows with client-side filter payloads | Track export size/build time; split or paginate before introducing runtime search. |
| Scheduled workflow causes duplicate deployments | One deployment owner, workflow concurrency, dataset hash comparison and one batch deployment. |
| Astro checker crash hides regressions | Reproduce against the locked dependency set, record separately, and use build, tests, smoke checks and a fixed checker version as independent gates. |
| Source text contains unsafe HTML/URLs | Render text as text, allowlist `http`/`https`, never inject remote HTML, and enforce response-size/time limits. |

## 8. Validation strategy

Run the following gates in order for each implementation phase:

1. **Static/tooling:** `npm run lint`, `npm run check`, `npm test`, `npm run validate:content`, `npm run build`.
2. **Aggregation unit tests:** adapter parsing, normalisation, dates/timezones, slug stability, URL validation, permission filtering, deduplication, null-preserving updates and retry/error classification.
3. **Database tests:** migration application, indexes/uniqueness, upsert idempotency, ingestion-run counts, status history and last-known-good retention.
4. **Route tests:** static paths for imported/editorial records, missing slug handling, active/expired/unverified states, course link-only rendering and no root-level route drift.
5. **SEO tests:** canonical URLs, sitemap inclusion/exclusion, breadcrumb data, `JobPosting` source/status restrictions and noindex query/filter behaviour.
6. **Security tests:** no credentials in generated files/logs, safe external links, bounded request body/response handling, no remote HTML rendering and unchanged employer-submission security checks.
7. **Workflow tests:** scheduled cron values, concurrency, manual-run logging, no-change deployment suppression, one deployment per changed batch and isolated source failure.
8. **Browser smoke checks:** mobile/desktop Work navigation, filters, empty states, source links, expired notices, course provider links and keyboard navigation.

The final release gate is satisfied only when the existing CI suite remains green, the aggregation fixture build passes with no credentials, one real approved source has completed a successful and failed run rehearsal, and the generated public dataset has a recorded hash/count report.

## 9. Acceptance criteria

- Existing Work URLs and static Astro output remain intact.
- At least one job source is permission-approved, attributed and imported through an adapter.
- Courses are available as a small, accurate link-only catalogue unless a stronger permission is explicitly verified.
- Jobs refresh no more than twice daily; courses no more than twice weekly.
- D1 ingestion runs, source outcomes and status changes are logged.
- Duplicate records do not create duplicate public slugs.
- Temporary source failures retain last-known-good records.
- Expired jobs remain useful where appropriate, are not shown as open, and have no active `JobPosting` markup.
- Himalayas records, if enabled, use the unchanged source application link and never receive `JobPosting` markup.
- Course price and certificate price are separate and never guessed.
- Sitemaps contain only canonical eligible routes; filter permutations are not indexed.
- Ordinary page views never query D1 or call a Worker.
- No deployment happens when the public dataset hash is unchanged.
- Existing employer submission and security flows remain unchanged and covered by CI.
- No credentials appear in generated JSON, client assets or logs.
- No paid service is introduced without explicit approval.

## 10. Recommended implementation sequence

Implement Phases 0–3 first, then stop for a review of the generated data contract and one-source route output. Continue with Phases 4–5 for jobs, then Phase 6 for the link-only course catalogue, followed by Phases 7–8. This sequencing keeps the existing Work UI usable throughout and limits the first production cut to a small, auditable dataset.

