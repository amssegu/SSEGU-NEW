# Phase 6 Readiness Gate

**Date:** 8 November 2026
**Decision:** PHASE 6: BLOCK — DO NOT PROCEED TO PHASE 7
**Owner:** SSEGU project owner with Cloudflare administrator

## Completed repository evidence

- Accessible responsive employer form at `/work/submit-job/` with required and
  optional fields, native constraints, client-friendly errors and a privacy /
  retention notice.
- Pages Function at `functions/api/job-submissions.ts` with request-size limits,
  server-side normalization and validation, origin checking, honeypot handling,
  Turnstile Siteverify, rate-limit binding, private D1 insertion and stable safe
  responses.
- Private queue schema and indexes in
  `migrations/d1/0001_create_job_submissions.sql`.
- Editorial review, status mapping, retention, deletion and recovery runbook in
  `docs/job-submission-operations.md`.
- Security matrix in `docs/job-submission-security-test-matrix.md`.

## Blockers

1. **Cloudflare administrator:** provision and bind `JOB_SUBMISSIONS_DB` in
   preview and production, apply the migration, and provide redacted recovery
   evidence.
2. **Cloudflare administrator:** provision `RATE_LIMITER` and record the chosen
   policy and preview/production behavior.
3. **Cloudflare administrator:** create a hostname-restricted Turnstile widget,
   set `PUBLIC_TURNSTILE_SITE_KEY`, store `TURNSTILE_SECRET_KEY` as a secret,
   and set `TURNSTILE_EXPECTED_HOSTNAME`.
4. **SSEGU engineering:** run the blocked rows in the security matrix against
   preview, then repeat the valid submission and recovery checks in production.

## Next action

After the bindings are provisioned, run the complete matrix, redact the review
and recovery records, and replace this decision only if all Phase 6 PASS criteria
are evidenced. No pending submission is published automatically, and no pending
record is included in public routes, search, sitemap or structured data.
