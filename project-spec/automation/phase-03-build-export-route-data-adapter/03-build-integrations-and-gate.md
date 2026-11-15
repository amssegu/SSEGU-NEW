# Phase 03 / Prompt 03 — Integrate export into builds and gate Phase 03

Wire the export into the build pipeline only in the selected deployment owner. Keep local fixture builds working and ensure CI does not require production credentials. Validate generated-data exclusion from git, deterministic output, no secret leakage and unchanged current Work/News/submission behaviour.

Gate requirements:

- export is reproducible and schema-validated;
- Astro routes consume data accessors, not D1/remote APIs;
- no-record and fixture builds succeed;
- existing unit/content/build/smoke checks remain green;
- generated output contains no private fields or credentials.

Write `phase-03-gate.md` with `PROCEED` or `BLOCK`.
