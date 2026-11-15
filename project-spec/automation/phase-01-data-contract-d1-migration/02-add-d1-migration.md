# Phase 01 / Prompt 02 — Add the aggregation D1 migration

Create an additive migration, preferably `migrations/d1/0002_create_work_aggregation.sql`, implementing the approved contract. Include checks, indexes, uniqueness and foreign-key behaviour where supported.

Keep `0001_create_job_submissions.sql`, `JOB_SUBMISSIONS_DB`, the submission API and KV bindings unchanged. Do not run a destructive production migration. Test on a disposable/local database first and document the exact apply command without embedding credentials.
