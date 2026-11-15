# Phase 03 / Prompt 02 — Build the compatibility data-access layer

Refactor `src/lib/work.ts` additively. Preserve existing exports where practical and add shared accessors/mappers for imported records, published editorial records and the explicit fixture fallback. Define precedence, duplicate-slug handling, publishability and filter-option derivation.

Do not change page templates yet. Do not let draft Content Collection entries become public. Add tests for empty generated data, mixed imported/editorial data, duplicate slugs, expired jobs and unknown optional fields.
