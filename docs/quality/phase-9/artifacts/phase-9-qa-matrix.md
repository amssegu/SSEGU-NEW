# Phase 9 QA matrix

- Date: 2026-11-09
- Decision: **BLOCK**
- Reproduction: `npm run review:phase9`

| Area | Evidence command or record | Result |
| --- | --- | --- |
| format | `npm run format:check` | pass |
| typecheck | `npm run check` | pass |
| unit | `npm test` | pass |
| submission-security | `npm run test:security` | pass |
| content | `npm run validate:content` | pass |
| redirects | `npm run validate:redirects` | pass |
| build | `npm run build` | pass |
| static-smoke | `npm run test:e2e` | pass |
| dependency-audit | `npm audit --omit=dev --audit-level=high --json` | pass |
| Static security and accessibility contract | `scripts/phase9-review.mjs` | pass |
| Lighthouse mobile/desktop | External measured report | not-run: supply measured mobile/desktop Lighthouse reports |
| Preview deployment probes | `PHASE9_PREVIEW_URL` | not-run: set PHASE9_PREVIEW_URL and run the preview probes |
| Backup/restore | Redacted operational record | not-run: attach a redacted D1 backup/restore record |
| Rollback | Previous verified release record | not-run: attach a previous-release rollback record |
| Accepted dependency warnings | Owner/date in phase-9-gate.json | SSEGU engineering / 2026-11-16 |

## Blockers

- Phase 8 is not PASS; resolve the reviewed Work-subdomain redirect failure before entering Phase 9.
- lighthouse evidence is not-run: supply measured mobile/desktop Lighthouse reports.
- preview evidence is not-run: set PHASE9_PREVIEW_URL and run the preview probes.
- backupRestore evidence is not-run: attach a redacted D1 backup/restore record.
- rollback evidence is not-run: attach a previous-release rollback record.
