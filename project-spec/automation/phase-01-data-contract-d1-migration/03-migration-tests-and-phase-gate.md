# Phase 01 / Prompt 03 — Validate the data contract and gate Phase 01

Add focused migration/schema tests for idempotent application, valid/invalid statuses, uniqueness, indexes and coexistence with the employer-submission schema. Verify that no private submission fields are part of public aggregation exports.

Gate requirements:

- contract is documented and matches the main specification;
- migration is additive, repeatable and tested locally;
- submission API/table behaviour is unchanged;
- source-specific restriction flags are representable;
- no production database write was performed without explicit approval.

Write `phase-01-gate.md` with `PROCEED` or `BLOCK`. Do not begin ingestion work on `BLOCK`.
