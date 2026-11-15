# Phase 00 fixture-only mode

The existing `/work/` routes continue to use the committed synthetic arrays in
`src/lib/work.ts`. They are route fixtures, not imported records and not
production-exported data. Phase 00 does not replace them, publish draft
content, add D1 reads, or add credentials.

The future aggregation boundary is `src/lib/work-automation-mode.ts`:

| `WORK_AUTOMATION_MODE` | Local result | Meaning |
| --- | --- | --- |
| `fixture` | `fixture` | Explicit local synthetic input for development/tests |
| `production-export` | `production-export` | Reserved for a later approved export adapter |
| unset or another value | `empty` | Safe local default; no generated records |
| any value in a production build | `disabled` | Automation is disabled until a later phase supplies the approved path |

Example local invocation:

```sh
WORK_AUTOMATION_MODE=fixture npm run build
```

This mode is deterministic and does not read `JOB_SUBMISSIONS_DB`,
`RATE_LIMIT_KV`, D1 credentials, API tokens, or source endpoints. The separate
employer-submission path remains unchanged and continues to own the
`JOB_SUBMISSIONS_DB` table and `RATE_LIMIT_KV` binding.

The `production-export` value is deliberately a label only in Phase 00. No
source adapter, D1 aggregation table, scheduled workflow, or production
export is enabled by this change.
