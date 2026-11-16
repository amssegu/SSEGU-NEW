# Phase 06 gate

**Decision: PROCEED**

The Work course catalogue is link-only and uses factual metadata supplied by
the provider-facing record. Course descriptions are short discovery summaries;
provider lessons, media, branding and copied course material are not rendered.

## Evidence

- Shared course accessors now expose subject, level, language, delivery mode,
  duration, separate course/certificate price status, availability, terms,
  attribution and last-checked metadata.
- Four curated records link to Saylor Academy, MIT OpenCourseWare, OpenLearn
  and freeCodeCamp. Provider affiliation, academic credit and free
  certificates are not implied.
- Course cards and detail pages validate provider/terms links as HTTPS and show
  attribution, availability and last-checked information.
- Filters are keyboard-accessible native form controls and query-string states
  are marked `noindex`; only canonical course detail URLs are linked in the
  sitemap.
- The course workflow runs at `0 4 * * 2,5` UTC, prevents overlap, emits
  source-level outcomes, records unverified handling and suppresses deployment
  when the public dataset hash is unchanged.

## Validation

- `npm run check`
- `npm run test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
