# Delivery Tracking, Risks and Decisions

**Status:** Phase 0 control register  
**Prepared:** 7 November 2026

## 1. Phase delivery backlog

| Phase | Prerequisite | Owner role | Deliverables | Exit evidence |
|---|---|---|---|---|
| 1. Discovery/intake/IA | Phase 0 PASS; supplied package or explicit dependency record | Migration lead + editorial owner | Provenance manifest, content/media/URL audits, route map, governance and frontend specification | Checksums, inventories, exception report, approvals |
| 2. Foundation | Phase 1 PASS | Technical lead | Astro/TypeScript/Tailwind app, scripts, structure, CI, preview, deployment docs | Clean-checkout install/check/build and preview record |
| 3. Frontend | Phase 2 PASS; approved route/design specs | Frontend lead + QA | Accessible responsive main-site routes and components using fixtures | Route smoke tests, accessibility/performance and visual review |
| 4. CMS/editorial | Phase 3 PASS; approved schemas/policy | CMS lead + editorial owner | Schemas, Decap config, auth/workflow, media guidance, runbook | Editor acceptance record; drafts private; CI validation |
| 5. Migration rehearsal | Phase 4 PASS; supplied data | Migration lead + editorial reviewers | Idempotent transform/media/slug/redirect tools, pilot and report | Reproducible pilot, redirect validation, editorial findings |
| 6. Full migration/SEO | Phase 5 PASS | Migration lead + SEO/editorial owners | Reviewed content, redirects, metadata, sitemap, structured data | URL coverage, SEO validation and content sign-off |
| 7. Integrated QA/ops | Phase 6 PASS | QA/security/operations owners | QA matrix, security/performance/accessibility reports, backup/rollback rehearsal | No blockers; release gate evidence |
| 8. Launch/stabilisation | Phase 7 PASS; launch approval | Project owner + deployment administrator | Tagged deployment, smoke tests, monitoring and handover | Production checklist, probes, observation record |
| 9. Maintenance | Phase 8 PASS | Operations owner | Recurring reviews, updates, backups and controlled-change records | Maintenance log and periodic review evidence |

Migration-dependent phases/tasks are blocked by missing supplied data, not treated as implementation failures.

## 2. Risk register

| Risk | P/I | Mitigation | Owner | Trigger / response | Status |
|---|---|---|---|---|---|
| Work scope expands prematurely | M/H | Explicit exclusion and review gate | Project owner | Work artefact appears; remove/change-control before proceeding | Open |
| Compromised live domain is used as source | M/H | Supplied package and provenance rule | Migration lead | Any scrape/reference appears; stop and document source correction | Open |
| Migration package missing/incomplete | H/H | Immutable manifest; keep dependent work blocked | Project owner + migration lead | Package absent/invalid; obtain owner-supplied replacement | Open |
| URL/SEO loss | M/H | Full inventory, dispositions, redirect validation and sign-off | SEO/migration owner | Unmapped high-value URL; hold migration/resolve manually | Open |
| Decap OAuth/auth fails | M/H | Early prototype, callback/error tests, external secret storage | CMS lead | Login/callback failure; stop bulk migration and remediate | Open |
| Editor usability fails | M/H | Independent editor acceptance test | Editorial owner | Test failure; revise workflow before migration | Open |
| Formatting/media loss | M/H | Exception report, media manifest, pilot review | Migration lead | Unsupported content/missing asset; manual review or explicit disposition | Open |
| Repository media growth | M/M | Resize/compress, monitor size, evaluate R2 only by approval | Technical lead | Size/build trend exceeds agreed threshold; review storage decision | Open |
| Provider quota/pricing changes | M/M | Verify current limits, monitor usage, retain portable backups | Operations owner | Limit/policy change; adjust design/provider via decision log | Open |
| Secrets or preview permissions exposed | M/H | Environment separation, least privilege, secret scans | Technical lead | Secret finding or preview access issue; revoke/rotate and investigate | Open |
| Performance/accessibility inadequate | M/H | Targets, measurement and manual review before release | QA owner | Failed representative check; remediate before gate | Open |
| Rollback/backups unusable | M/H | Backup/restore and rollback rehearsals | Operations owner | Restore failure; halt launch and repair recovery path | Open |

## 3. Open-decision register

| Decision | Owner | Due phase | Delay impact | Default-safe behaviour | Status |
|---|---|---|---|---|---|
| Confirm project owner, GitHub ownership and reviewers | Andronicus Enoch M. | Phase 0 gate | Governance cannot be enforced | Project owner is confirmed; retain single-owner review until client handover | Resolved for current implementation; handover follow-up |
| Confirm final launch route set after audit | Project owner + editorial owner | Phase 1 | Route/build decisions may be wrong | Use only provisional routes; no final mapping | Open |
| Include search at launch | Project owner + editorial owner | Phase 1 | Affects IA and frontend scope | Exclude until approved | Open |
| Select editorial approval model | Editorial owner | Phase 1/4 | Affects CMS workflow | Use reviewed PR/draft workflow | Open |
| Define analytics policy | Project owner | Phase 1/6 | Affects scripts/privacy docs | No analytics integration | Open |
| Confirm contact-form requirement | Project owner | Phase 1/3 | May require provider/server feature | Static contact details only | Open |
| Select and verify Decap auth arrangement | Technical lead + project owner | Phase 4 | CMS cannot be released safely | No bulk migration/CMS launch | Open |
| Confirm Cloudflare project and environment ownership | Deployment administrator | Phase 2 | Preview/deploy cannot be evidenced | No deployment claim | Open |
| Confirm provider limits/pricing | Operations owner | Phase 2/7 | Cost/reliability uncertainty | Stay static and portable | Open |
| Client handover and custom-domain association | Andronicus Enoch M. + future client administrator | Phase 8 | Ownership/deployment continuity may fail | Keep current Pages project as operational source until handover checklist passes | Open |
| Synthetic fixture content reaches handoff | Andronicus Enoch M. | Before Phase 6/8 handoff | Placeholder copy/routes/media could be published as real content | Keep fixture-only labels and block handoff until replacement/re-audit is signed off | Open |
| Fixture data delays development | Andronicus Enoch M. | Phase 2 | Missing migration data could stop time-sensitive foundation work | Use the approved synthetic fixture set for development; retain migration/launch gate before handoff | Accepted temporary exception |

## 4. Phase-gate evidence standard

Each gate record must identify the reviewer, date, decision, artefacts and checklist result. Acceptable evidence includes repository files/commits, command output, test reports, screenshots, deployment records, review sign-offs, immutable checksums and explicit external-setting confirmation. A plan or intended configuration is not evidence of an external setting. Missing evidence is recorded as a blocker with an owner and remediation action.

The current implementation uses one production environment (`https://ssegu-new.pages.dev/`) and does not currently provision separate local or preview environments. This is an explicit project decision, not evidence that those environments exist. Client transfer, Cloudflare reassociation and custom-domain linking are handover activities and require their own evidence.

