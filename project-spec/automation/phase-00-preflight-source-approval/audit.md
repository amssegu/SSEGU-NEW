# Phase 00 repository and deployment audit

**Checked:** 15 November 2026 (Africa/Kampala)  
**Scope:** read-only repository/deployment audit before aggregation work

## Repository and deployment ownership

- Repository checkout: `SSEGU-NEW`; current working tree already contains
  user-supplied untracked planning files under `project-spec/`.
- `astro.config.mjs` is static output with site `https://ssegu.com`.
- `wrangler.toml` names the Pages project `ssegu-new` and points Pages output
  at `./dist`.
- The configured production-looking submission resources are
  `JOB_SUBMISSIONS_DB` (`ssegu-job-submissions-production`) and
  `RATE_LIMIT_KV`. This is evidence of existing infrastructure, not proof of
  Pages project ownership or permission to change it.
- No Cloudflare account/project owner, Pages dashboard export, GitHub Pages
  integration record, or deployment credential is present in the checkout.
- `.github/workflows/ci.yml` is quality CI only. There is no Pages deployment
  workflow, aggregation workflow, or Wrangler deploy step.

**Ownership result: INHERITED BASELINE.** This work continues the existing
`ssegu-new` Pages project and its current deployment arrangement. Phase 00 does
not create a Pages project, change the production branch, add a Wrangler deploy
step, or add a second deployment owner. The repository's `wrangler.toml` and
existing CI workflow are treated as inherited project evidence; the active
Cloudflare dashboard settings remain operational ownership outside this
checkout and are not changed by the automation work.

Before any future prompt adds a deployment workflow, the project owner should
confirm the current Pages Git/Actions arrangement in the release record. That
confirmation is a rollout prerequisite, not a reason to re-bootstrap this
continuing project in Phase 00.

## Toolchain actually present

| Item | Evidence |
| --- | --- |
| Node | `v22.23.2` |
| npm | `10.9.8` (package declares `>=10.0.0`) |
| Astro | `7.4.1` in `package.json` |
| TypeScript | `6.0.3` in `package.json` |
| Wrangler | No local dependency or installed executable was found; `npx wrangler --version` was not used as evidence because it would resolve/download a package |
| CI Node | GitHub Actions requests Node `22` |

## Bindings and ownership boundaries

- `migrations/d1/0001_create_job_submissions.sql` owns the employer submission
  table.
- `functions/api/job-submissions.ts` uses `JOB_SUBMISSIONS_DB`,
  `RATE_LIMIT_KV`, and `TURNSTILE_SECRET_KEY`.
- There is no aggregation D1 binding or aggregation migration.
- Phase 00 therefore leaves all existing submission bindings, migrations,
  functions, routes and data contracts untouched.

## Baseline commands

| Command | Result |
| --- | --- |
| `npm test` | PASS — `unit checks passed` |
| `npm run lint` | FAIL — Prettier reports existing issues in `src/lib/content.ts`, `src/pages/[slug].astro`, and `src/styles/global.css` |
| `npm run validate:content` | PASS — 13 collections, 35 legacy fixture rows |
| `npm run build` | PASS — static build, 1,736 pages |
| `npm run test:e2e` | PASS — static smoke checks passed |
| `npm run check` | PASS on this run — 69 files, 0 errors/warnings/hints |

The implementation-plan note about an Astro-check segmentation fault was not
reproduced on this run. It remains a historical/known-risk note until CI
reproduces it; it is not a current failure signal.

## Files not to touch in Phase 00

- Existing employer submission implementation:
  `functions/api/job-submissions.ts`, `migrations/d1/0001_create_job_submissions.sql`
- Existing bindings and deployment configuration:
  `wrangler.toml`, unless ownership evidence later authorises a narrowly scoped
  additive change
- Existing News and Work route contracts under `src/pages/`, except additive
  fixture-mode documentation/diagnostics
- Existing content fixtures and editorial collections under `src/content/`
- User-supplied untracked planning files currently in `project-spec/`

## Audit conclusion

Local fixture-only development is safe and needs no production D1 credentials.
Source permission evidence is recorded separately. Phase 00 records the
deployment project as inherited and does not authorize scheduled ingestion or
deployment changes.
