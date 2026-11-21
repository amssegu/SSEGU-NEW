# Aggregation ingestion boundary

Phase 2 keeps ingestion independent of Astro rendering. The runtime modules
under this directory are pure source/record/policy/persistence helpers; routes
do not import them.

The live job allowlist is limited to Himalayas search results filtered for
Uganda eligibility and Remote OK. Himalayas is queried through its country and
worldwide filters, and its original application URL is retained. ReliefWeb
remains disabled until the project has an approved `appname` and reuse review.
JubaJobs and YubHub records are removed from the live database when the next job
aggregation plan is applied.

The course catalog uses freeCodeCamp's certification catalog and Microsoft
Learn's authenticated catalog API. Microsoft Learn requires an onboarded Entra
application and an access token for `https://learn.microsoft.com/.default`.
The workflow gets a short-lived token through GitHub OIDC when Azure repository
variables `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `AZURE_SUBSCRIPTION_ID` are
configured; `MICROSOFT_LEARN_ACCESS_TOKEN` is available as a manual fallback.
MIT OpenCourseWare and OpenLearn are retired from ingestion and their records
are removed on the next course aggregation run.

Public job and course snapshots start empty. The manual `Clear Work catalog
listings` workflow clears existing job and course rows from both production D1
databases. The next aggregation run then imports only the selected providers,
verifies their source records, and publishes fresh snapshots. Cloudflare Pages
remains the sole production deployment owner.
