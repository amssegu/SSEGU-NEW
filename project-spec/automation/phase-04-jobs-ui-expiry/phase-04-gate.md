# Phase 04 gate

**Decision: PROCEED**

Phase 04 homepage, listing and detail integration is complete for the approved
fixture frontend.

## Evidence

- `/work/` and `/work/jobs/` now read jobs and filter options through shared
  accessors. Location, employment type and arrangement options are derived from
  the available records; no Kampala/Remote-only assumption remains.
- The listing defaults to active opportunities, supports all/expired states,
  preserves query URLs, escapes client-rendered values and bounds the client
  payload to 100 records.
- Stable detail routes render active, expired, withdrawn, unverified and
  missing-deadline fixtures. Non-active records are marked `noindex`, retain
  useful status information, and do not expose active application CTAs.
- Source attribution and external application links are rendered only when the
  corresponding verified fields exist, with external-link protections.
- `JobPosting` is emitted only for active, non-expired, deadline-bearing,
  source-permitted records without an explicit schema prohibition. Withdrawn,
  unverified, expired and missing-deadline records emit no `JobPosting` markup.
- Existing Work navigation, skip-link/main landmark structure, breadcrumbs,
  stable `/work/` and `/work/jobs/` URLs, and the editorial Work feature remain
  intact.

## Verification

- `npm run build` — passed; 1,739 pages generated.
- `npm run test` — passed.
- `npm run test:e2e` — passed, including the Phase 04 fixture-route and schema
  assertions.
- Targeted fixture assertions — passed for all five required states.
- `npm run check` was attempted but remains red on pre-existing repository-wide
  Node/content typing configuration errors in `src/lib/work.ts`; the static
  build and required unit/smoke checks pass.
