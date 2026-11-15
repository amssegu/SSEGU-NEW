# Phase 05 / Prompt 03 — Add controlled jobs scheduling and gate Phase 05

Create the jobs GitHub Actions workflow with `15 3 * * *` and `15 15 * * *` UTC schedules, concurrency protection, least privilege, bounded retries, per-source results, D1 update, dataset hash comparison and one batch build/deploy only when public data changes.

Manual dispatch must be exceptional and logged. Do not enable duplicate Pages/GitHub deployments. Test workflow syntax and a dry-run/report-only path.

Gate requirements:

- no overlapping scheduled runs;
- approved sources only;
- source failures retain last-known-good data;
- no-change runs do not deploy;
- restricted-source rules pass tests;
- no credentials are printed.

Write `phase-05-gate.md` with `PROCEED` or `BLOCK`.
