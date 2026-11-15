# Phase 08 / Prompt 04 — Stage enablement and gate the complete feature

Enable one approved job source, verify one successful and one failed scheduled-run rehearsal, then enable additional job sources one at a time. Enable the course catalogue separately. Remove fixture fallback only after route/data parity and rollback evidence are recorded.

Final gate requirements:

- all previous phase gates are `PROCEED`;
- existing CI/build/smoke/security checks pass;
- at least one approved job source completed success and failure rehearsals;
- course catalogue is accurate and link-only unless stronger rights are documented;
- job/course schedules obey their maximum frequencies;
- no-change runs do not deploy and overlapping runs are prevented;
- sitemap, canonical, expiry, attribution and structured-data checks pass;
- employer submissions, News routes and existing Work URLs remain intact;
- backup, rollback, source disablement and removal procedures are documented;
- no paid service or unapproved credential was introduced.

Write `phase-08-gate.md` with `PROCEED` only if the feature is ready for production enablement. Otherwise write `BLOCK`, preserve the last-known-good state, identify the exact failed requirement, and stop. Do not declare completion by bypassing an unresolved gate.
