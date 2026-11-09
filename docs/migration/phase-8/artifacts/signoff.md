# Phase 8 Content and URL Sign-off

- Date: 2026-11-09
- Status: Approved by the project owner; release gate remains BLOCK pending live redirect verification
- News and Work datasets remain separate.
- Article-specific media uses AVIF/WebP where conversion succeeds; approved hosted URLs are preserved as fallbacks; legacy JPEG copies were removed.
- Migration exceptions are explicitly dispositioned: approved source media remains linked when local conversion is unavailable.
- Redirect map validation: PASS (1578 rows).
- Live subdomain probe: FAIL; work.ssegu.com did not return the reviewed 301 destinations.
- Owner: SSEGU project owner with editorial and SEO reviewers

See reports/phase-8-gate.json for rollback notes and next action.
