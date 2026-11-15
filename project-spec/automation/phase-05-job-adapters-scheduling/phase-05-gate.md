# Phase 05 gate

**Decision: BLOCK**

The Phase 05 implementation is prepared and safe to rehearse, but production
enablement cannot proceed because the source-permission register does not yet
approve the candidate sources and the scheduled workflow is intentionally
report-only.

## Completed evidence

- Isolated adapters and redacted fixtures exist for Remote OK, YubHub,
  ReliefWeb and Himalayas. Each source remains `enabled: false`.
- Remote OK preserves its original listing URL and visible attribution data.
- Himalayas preserves `applicationLink`, carries salary-period data, removes
  expired records through normal expiry status handling, and propagates
  `prohibitJobpostingSchema`.
- ReliefWeb requires an approved `appName` before validation can pass.
- Restricted sources cannot bypass permission checks, source-application-link
  checks, or the no-`JobPosting` policy through generic normalization or Work
  sitemap eligibility.
- The jobs workflow has the required `15 3 * * *` and `15 15 * * *` UTC
  schedules, non-overlapping concurrency group, least-privilege contents
  permission, timeout, and report-only artifact path.
- `npm run test:aggregation` passed.
- `npm run build`, `npm run test`, `npm run test:e2e`, workflow static syntax
  assertions, and `git diff --check` passed.
- The report-only rehearsal produced per-source output and
  `publicDataChanged: false` without fetching, writing D1, building, deploying,
  or printing credentials.

## Blocking evidence

- The source register still marks YubHub, Remote OK, ReliefWeb and Himalayas as
  `permission_required`/disabled. ReliefWeb has no approved `appname`; YubHub
  has no approved exact feed URL; Himalayas has no accepted terms/reuse
  approval.
- JubaJobs is owner-approved for factual metadata but remains disabled pending
  controlled Phase 05 enablement. No live source should be enabled by this
  change without the register update.
- The workflow does not yet update production D1, compare a previous public
  dataset hash, or perform the single build/deploy on change. Those operations
  require an explicitly approved D1/deployment credential and owner-confirmed
  deployment ownership; adding them now would violate the no-credentials and
  no-duplicate-deployment constraints.

## Required unblock actions

1. Record owner approval, exact endpoint/field scope, attribution and terms for
   each source to be enabled.
2. Add the approved ReliefWeb `appName` through a secret reference, never in
   source or logs.
3. Confirm the single deployment owner and provide scoped D1/deployment
   credentials.
4. Add a rehearsal with last-known-good retention, D1 update, dataset-hash
   comparison, one conditional build/deploy, and rollback evidence.
