# Phase 01 gate — PROCEED

**Checked:** 15 November 2026 (Africa/Kampala)

## Evidence

| Requirement | Result | Evidence |
|---|---|---|
| Contract documented and versioned | PASS | `contract.md` v1.0 defines sources, jobs, courses, runs, status history, enums, timestamps, slug/uniqueness and publishability rules |
| Representative redacted fixtures exist | PASS | `project-spec/content-fixtures/aggregation/phase-01-contract-fixtures.json` |
| Migration is additive and isolated | PASS | `migrations/d1/0002_create_work_aggregation.sql`; `0001_create_job_submissions.sql` unchanged |
| Idempotent application tested | PASS | `npm run test:migration` applies both migrations twice to disposable SQLite |
| Constraints and indexes tested | PASS | Valid inserts, invalid enum, duplicate source identity, indexes and foreign-key schema exercised |
| Submission API/table unchanged | PASS | Existing table is created and inserted alongside aggregation records; API has no aggregation references |
| Source restrictions representable | PASS | `restriction_flags_json` plus permission and status fields |
| No private submission fields exported | PASS | Migration/test assertions exclude private submission fields |
| Remote database isolated and migration applied | PASS | `remote-database.md`; `WORK_AGGREGATION_DB` is separate, only `0002` was applied, and the submission database remains unchanged |

## Validation commands

- `npm run test:migration` — pass
- `npm test` — pass
- `npm run check` — pass
- `npm run validate:content` — pass
- `npm run build` — pass
- `npm run test:e2e` — pass

## Apply command for a disposable/local D1 database

Do not run this against production without explicit approval. After a separate
aggregation D1 binding is provisioned in a later authorised step, apply with
the repository's pinned Wrangler version using the binding-specific command,
for example:

```sh
npx wrangler d1 migrations apply <AGGREGATION_DB_NAME> --local
```

The remote database and binding are documented in `remote-database.md`. The
existing `JOB_SUBMISSIONS_DB` binding remains unchanged and must not receive
this migration.

## Decision and next prompt

**PROCEED to Phase 02 / Prompt 01 — Add ingestion primitives.** No source
adapter is enabled by this gate; source permission records and fixture-only
operation remain authoritative until a later phase approves an adapter.
