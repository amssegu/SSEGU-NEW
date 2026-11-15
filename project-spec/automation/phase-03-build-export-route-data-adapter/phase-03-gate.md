# Phase 03 Gate — Build/export route data adapter

Status: **PROCEED**

Date: 2026-11-15

## Evidence

- `scripts/work-export.mjs` produces deterministic `jobs.json`, `courses.json`, and `manifest.json` output.
- Export rejects disabled sources, permission-required records, unsafe URLs, private fields, and duplicate slugs.
- `npm run export:work` defaults to an empty, credential-free dataset. `WORK_EXPORT_MODE=fixture npm run build` validates the local imported-record path.
- Generated files live under `src/data/generated/` and are ignored by Git; only `.gitkeep` is tracked.
- `src/lib/work.ts` preserves the existing synchronous exports and adds imported/editorial/fixture precedence, async published accessors, slug accessors, publishability checks, and filter-option helpers.
- Public Astro routes continue to import the compatibility layer and do not import D1, Wrangler, or remote APIs.
- `npm run test:work-export` passed.
- `npm run build` passed with the default empty export (50 pages).
- `WORK_EXPORT_MODE=fixture npm run build` passed (51 pages).

## Checks

The repository's existing `npm run check` command is intermittently terminating with an upstream TypeScript/Node segmentation fault in this environment; the same check had passed serially before this Phase 3 change and the Astro production builds type-transform and render the modified module successfully. No Phase 3 diagnostic was emitted before the crash.

The first fixture build attempt hit the same intermittent toolchain crash; the immediate serial retry passed.

## Scope boundary

Phase 3 does not enable live source fetching, does not connect public routes to D1, and does not change page templates. Source activation and scheduled ingestion remain Phase 5 work.
