# Phase 02 / Prompt 03 — Add orchestration and gate Phase 02

Implement prepared-statement persistence, idempotent upserts, ingestion-run logging, status-history writes and last-known-good retention. Add a job runner that processes enabled sources independently and never deletes/expirs all records after one source failure.

Run tests including a simulated source outage, duplicate replay, changed record, missing optional field and reliable expiry. Do not schedule production runs yet.

Gate requirements:

- all primitives have deterministic tests;
- JubaJobs is isolated and disabled unless approved;
- no source failure removes prior records;
- D1 writes are prepared/idempotent;
- credentials and raw sensitive payloads are absent from logs.

Write `phase-02-gate.md` with `PROCEED` or `BLOCK`.
