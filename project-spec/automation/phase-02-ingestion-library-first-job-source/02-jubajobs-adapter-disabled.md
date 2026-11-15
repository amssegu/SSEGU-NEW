# Phase 02 / Prompt 02 — Add the disabled-by-default JubaJobs adapter

Implement one isolated JubaJobs jobs-feed adapter against the exact approved endpoint and observed payload shape. Preserve source IDs, original URLs, required backlink/attribution and only permitted fields. Do not add tenders or training opportunities.

Add a redacted sample payload and adapter tests for valid, malformed, empty and partial records. The adapter must remain disabled unless the Phase 00 permission register explicitly marks it approved.
