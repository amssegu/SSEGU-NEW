# Phase 05 gate

**Decision: BLOCK**

The Phase 05 implementation is prepared for controlled production ingestion.
JubaJobs, Remote OK, YubHub and Himalayas have project-owner approval and are
enabled in the source registry. ReliefWeb remains disabled. Cloudflare Pages
remains the sole production deployment owner; GitHub Actions is limited to
scheduled aggregation and D1 operations.

## Completed evidence

- Isolated adapters and redacted fixtures exist for Remote OK, YubHub,
  ReliefWeb and Himalayas. JubaJobs, Remote OK, YubHub and Himalayas are
  approved and enabled; ReliefWeb remains `enabled: false` pending `appname`.
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
- Authorized read-only verification of `ssegu-work-aggregation-production`
  passed; the expected aggregation tables are present and no rows were
  written.
- The first authorized live D1 rehearsal succeeded for all four approved
  sources: 20 JubaJobs, 95 YubHub, 48 Remote OK and 20 Himalayas records were
  accepted and persisted.
- A D1-to-static-export build succeeded with 183 imported job records and
  1,922 generated pages.
- The live workflow now invokes `wrangler pages deploy` against the existing
  `ssegu-new` Cloudflare Pages project using a separate Pages deployment token;
  report-only manual runs never deploy.
- `npm run build`, `npm run test`, `npm run test:e2e`, workflow static syntax
  assertions, and `git diff --check` passed.
- The report-only rehearsal produced per-source output and
  `publicDataChanged: false` without fetching, writing D1, building, deploying,
  or printing credentials.

## Blocking evidence

- The source register records project-owner approval for JubaJobs, YubHub,
  Remote OK and Himalayas. ReliefWeb still has no approved `appname`; its
  publisher-field reuse is approved by the project owner but still requires
  field-level validation against the source terms once the appname exists.
- The workflow now updates production D1, builds from the resulting export,
  and invokes the single Cloudflare Pages deployment path, but it does not yet
  compare a previous public dataset hash or retain a last-known-good export.
  Those are the remaining Phase 05/rollout controls.

## Required unblock actions

1. Add dataset-hash comparison and last-known-good retention around the live
   D1/export path, preserving the recorded endpoint, field scope, attribution
   and terms.
2. Add the approved ReliefWeb `appName` through a secret reference, never in
   source or logs.
3. Confirm the Cloudflare Pages automatic-production-deployment toggle remains
   disabled so only this workflow deploys the project.
4. Add rollback evidence for the last-known-good export and Cloudflare Pages
   deployment.
