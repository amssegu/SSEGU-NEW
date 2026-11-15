# Aggregation ingestion boundary

Phase 2 keeps ingestion independent of Astro rendering. The runtime modules
under this directory are pure source/record/policy/persistence helpers; routes
do not import them.

`JUBAJOBS_SOURCE` uses the observed JSON endpoint
`https://jubajobs.com/feed/jobs?format=json`. The project owner has approved
factual metadata redistribution with attribution, but the source remains
`enabled: true` for the controlled Phase 05 schedule. The
adapter handles jobs only; JubaJobs tenders,
scholarships and training feeds are intentionally out of scope.

Run the deterministic suite with:

```sh
npm run test:aggregation
```

The Phase 05 workflow may fetch the four approved sources and write only to the
separate `WORK_AGGREGATION_DB` D1 binding. ReliefWeb remains disabled until its
`appname` is approved. Cloudflare Pages remains the sole production deployment
owner; the scheduled workflow must not add a competing Pages deployment.
