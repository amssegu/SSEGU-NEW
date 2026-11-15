# Phase 02 / Prompt 01 — Implement safe ingestion primitives

Add the smallest dependency-light ingestion library under the location selected by the plan. Implement typed records, bounded HTTP, timeout/retry policy, URL allowlisting, text normalisation, date handling, stable slug generation, validation, quarantine, deduplication and refresh-frequency policy.

Keep the library independent of Astro rendering. It must distinguish fetch failure, malformed response, valid empty response and confirmed disappearance. Never overwrite known values with temporary nulls. Add unit fixtures before wiring a live source.
