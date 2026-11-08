# Phase 4 Scope Decision

**Decision date:** 8 November 2026  
**Decision:** Approved for Phase 4 fixture frontend implementation  
**Owner:** Andronicus Enoch M.  
**Status:** Recorded and implemented

The consolidated implementation plan and `new-tech-spec.md` bring the Work
frontend into the current delivery scope under `/work/`. This decision
supersedes the earlier main-site-only fixture boundary for this phase only.

The approval covers:

- An independent Work shell, components, styles and fixture content.
- The `/work/` route namespace and the approved Work listing/detail routes.
- News-to-Work and Work-to-News navigation.
- Static, local fixture filtering and responsive frontend behavior.

The approval does not authorize DNS changes, `work.ssegu.com` redirects, CMS,
migration imports, employer submissions, accounts, applications, databases,
external forms or live Work data. Those remain later-phase work and retain
their own gates.

## Governing sources

- `project-spec/new-tech-spec.md`, route architecture and testing criteria.
- `project-spec/implementation phases/implementation-plan.md`, Phase 4 roadmap
  and Work design acceptance basis.
- `project-spec/sseguwork.png`, visual authority for the Work frontend.

