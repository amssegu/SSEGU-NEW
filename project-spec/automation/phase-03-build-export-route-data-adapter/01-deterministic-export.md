# Phase 03 / Prompt 01 — Implement the build-time export

Create the prebuild export command and generated-data contract for `jobs.json`, `courses.json` and `manifest.json`. Export only approved publishable records, validate unique slugs/safe URLs, exclude private fields, sort deterministically and calculate a dataset hash.

Keep output ephemeral or explicitly ignored by git. Support fixture-only and empty-data local builds without production credentials. Never query D1 from public Astro routes.
