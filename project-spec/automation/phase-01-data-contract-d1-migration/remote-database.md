# Phase 01 remote aggregation database

**Provisioned:** 15 November 2026 (Africa/Kampala)  
**Cloudflare region:** WEUR  
**Database name:** `ssegu-work-aggregation-production`  
**Database ID:** `46a7ddbe-cd84-42fb-b4d6-bb5f5a4a137b`  
**Wrangler binding:** `WORK_AGGREGATION_DB`

The repository already had a separate employer-submission database:
`JOB_SUBMISSIONS_DB` / `ssegu-job-submissions-production` /
`87fe7aaa-a7b0-4c60-a10a-dc88f0b63004`. It was not changed.

## Migration application

The aggregation database was empty when provisioned. Migration
`migrations/d1/0002_create_work_aggregation.sql` was applied directly with:

```sh
set -a; . ./.env.local; set +a
export CLOUDFLARE_API_TOKEN="$CLOUDFLARE_TOKEN"
node /home/andronicus/.npm/_npx/32026684e21afda6/node_modules/wrangler/bin/wrangler.js \
  d1 execute ssegu-work-aggregation-production --remote \
  --file migrations/d1/0002_create_work_aggregation.sql
```

The shared `migrations/d1` directory also contains submission migration
`0001_create_job_submissions.sql`; it was intentionally not applied to this
database. Future aggregation migrations must be applied explicitly to
`WORK_AGGREGATION_DB` or moved into a dedicated aggregation migration path
before using `d1 migrations apply`.

## Verification

The remote schema must contain only the aggregation tables:

- `content_sources`
- `jobs`
- `courses`
- `ingestion_runs`
- `listing_status_history`

It must not contain `job_submissions`. The exact verification command is:

```sh
set -a; . ./.env.local; set +a
export CLOUDFLARE_API_TOKEN="$CLOUDFLARE_TOKEN"
node /home/andronicus/.npm/_npx/32026684e21afda6/node_modules/wrangler/bin/wrangler.js \
  d1 execute ssegu-work-aggregation-production --remote \
  --command "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;"
```

No source was enabled and no records were inserted.
