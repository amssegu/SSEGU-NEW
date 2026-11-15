# Jobs and Courses Aggregation Automation Prompts

These prompts execute `jobs-courses-aggregation-implementation-plan.md` in a least-destructive sequence.

Run prompts in numeric order. Do not skip a phase gate. Each phase's final prompt is a release gate:

- **PROCEED** means all stated evidence exists and the next phase may begin.
- **BLOCK** means stop implementation, preserve the working tree, record the failing evidence, and do not work around the gate by weakening requirements.

General rules for every prompt:

1. Read the main specification, source register, implementation plan, current phase folder, and relevant repository files before acting.
2. Preserve existing `/work/` URLs, static output, News routes, employer submissions, D1 submission tables, and user changes.
3. Use additive changes and reversible migrations. Never delete or overwrite existing content to make a test pass.
4. Do not enable a source, deploy, modify production data, or add credentials unless that prompt explicitly authorises the step and the required approval exists.
5. Run the prompt's validation commands and report changed files, evidence, unresolved risks and the gate result.

## Sequence

| Phase | Folder | Outcome |
|---:|---|---|
| 0 | `phase-00-preflight-source-approval` | Approved scope, deployment owner, source register and fixture-only mode |
| 1 | `phase-01-data-contract-d1-migration` | Additive aggregation schema isolated from submissions |
| 2 | `phase-02-ingestion-library-first-job-source` | Tested ingestion primitives and disabled-by-default JubaJobs adapter |
| 3 | `phase-03-build-export-route-data-adapter` | Deterministic export and compatibility data-access layer |
| 4 | `phase-04-jobs-ui-expiry` | Existing Work jobs routes render imported records safely |
| 5 | `phase-05-job-adapters-scheduling` | Approved job adapters and controlled jobs workflow |
| 6 | `phase-06-courses-link-only-catalogue` | Accurate link-only courses integrated into Work |
| 7 | `phase-07-seo-sitemaps-navigation` | Canonical discovery and structured-data behaviour aligned |
| 8 | `phase-08-validation-rollout-operations` | CI, rehearsals, staged enablement and operational handoff |
