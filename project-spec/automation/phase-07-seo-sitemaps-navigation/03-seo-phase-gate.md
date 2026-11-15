# Phase 07 / Prompt 03 — Gate SEO and discovery integration

Run static build, sitemap parsing, canonical checks, structured-data checks and route smoke tests.

Gate requirements:

- sitemap URLs match generated canonical pages;
- status, visible page content and structured data agree;
- no expired/unverified job has active `JobPosting` markup;
- restricted sources cannot enter prohibited markup;
- query filters and empty categories are not unintentionally indexable;
- existing News discovery files and routes are unchanged.

Write `phase-07-gate.md` with `PROCEED` or `BLOCK`.
