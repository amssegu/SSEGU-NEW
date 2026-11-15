# Aggregation ingestion boundary

Phase 2 keeps ingestion independent of Astro rendering. The runtime modules
under this directory are pure source/record/policy/persistence helpers; routes
do not import them.

`JUBAJOBS_SOURCE` uses the observed JSON endpoint
`https://jubajobs.com/feed/jobs?format=json`. The project owner has approved
factual metadata redistribution with attribution, but the source remains
`enabled: false` until the controlled Phase 05 scheduling/enablement gate. The
adapter handles jobs only; JubaJobs tenders,
scholarships and training feeds are intentionally out of scope.

Run the deterministic suite with:

```sh
npm run test:aggregation
```

No live source fetch, scheduled workflow, or production ingestion run is
enabled by Phase 2.
