# Phase 7 migration rehearsal

**Status:** Phase 7 PASS; proceed to Phase 8. Accepted limitations are recorded
in the generated gate and must be carried into the migration plan.

## Immutable source contract

- Source repository: `https://github.com/amssegu/ssegu`
- Work source boundary: `posts/`
- News source boundary: dated folders such as `2024/05/` and `2026/10/`, plus
  eligible main-site static pages
- Excluded boundaries: `tv/`, Firimu/movie/video/episode entries and other
  records classified out of scope by the report
- Pinned commit: `474cea16ebf0dd6c8fc5e4ea7d7c5b45e2277fd8`
- Retrieval date: 9 November 2026
- All HTML inputs are hashed and classified in the generated manifests and
  `reports/excluded-source-records.json`.
- The repository's current `src/content` News collections remain a separate
  fixture-only manifest.
- Original source files are never modified or copied into `src/content` by the
  rehearsal.

## Reproducible invocation

```sh
npm run migrate:phase7 -- \
  --source-root /path/to/amssegu-ssegu \
  --work-ref 474cea16ebf0dd6c8fc5e4ea7d7c5b45e2277fd8 \
  --retrieved-at 2026-11-09
```

Generated artifacts are written under `docs/migration/phase-7/artifacts/`.
The runner recreates that directory deterministically. It writes separate
News/Work manifests, an explicit excluded-record report, per-file SHA-256
checksums, source classification, Work provenance, conversion and media
exceptions, News and Work pilots, slug and redirect reports, and the Phase 7
evidence gate.

## Mapping rules

Files under `posts/` are Work candidates. Dated-folder files are classified as
News, Work or excluded using explicit rules, with the reason and confidence
recorded for every file. Dated duplicates of `posts/` records remain traceable
and are flagged as collisions rather than silently discarded.

Work HTML posts are staged as `work-articles` drafts for the pilot because the
source does not provide verified employer, deadline, application or structured
vacancy fields. Filename patterns may suggest courses or jobs, but they do not
promote a record into the `courses`, `jobs` or `internships` collections and do
not invent missing facts. All pilot records require editorial review.

External images are recorded as `manual-review`; they are not downloaded or
published. Scripts, iframes, forms and other unsupported markup are removed
from the pilot body and listed in the exception report.

## Current gate

The generated gate is PASS. The project owner approved the classification,
pilots and source-media ownership. Convert owned media to AVIF/WebP before
publication, carry non-critical markup exceptions into Phase 8 review, and
complete the broader historical URL inventory before final cutover.
