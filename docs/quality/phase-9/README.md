# Phase 9 — Integrated quality, security, performance and operations

Phase 9 is a reproducible production-readiness review for the consolidated News and Work site. Run the local review with:

```sh
npm run review:phase9
```

The command runs formatting, Astro diagnostics, unit checks, submission-security tests, content validation, redirect validation, a production build, static smoke checks and the high-severity dependency audit. It then performs static security/accessibility checks and writes dated records under `artifacts/`.

The review intentionally does not invent evidence for infrastructure-only controls. Before a Phase 9 PASS, the deployment owner must attach:

- measured mobile and desktop Lighthouse results;
- preview URL probes for News, Work, redirects, sitemaps, RSS, 404s, CMS access and submission behavior;
- a redacted D1 backup/restore record where D1 is used; and
- a rollback record naming the previous verified release and deployment.

Supply those records using `PHASE9_LIGHTHOUSE_REPORT`, `PHASE9_PREVIEW_URL`, `PHASE9_BACKUP_EVIDENCE` and `PHASE9_ROLLBACK_EVIDENCE`, then rerun the review. A non-zero exit is an explicit BLOCK and must not be overridden by treating an unmeasured item as passed.
