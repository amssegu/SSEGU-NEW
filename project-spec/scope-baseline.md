# SSEGU Project-Control Scope Baseline

**Status:** Approved by project owner; operational controls still tracked in the Phase 0 gate  
**Prepared:** 7 November 2026  
**Governing documents:** [`techspec.md`](techspec.md), [`implementation-plan.md`](implementation%20phases/implementation-plan.md)

## 1. Release boundary

This release rebuilds the main SSEGU publication at `ssegu.com` as a static-first Astro application backed by GitHub, Decap CMS and Cloudflare Pages. The repository is currently specification-only; no application implementation is authorised by this baseline.

The current project owner and final authority is **Andronicus Enoch M.** All repository, implementation, deployment, provider and scope decisions are currently owned by the project owner/developer until ownership is transferred to the client.

The approved frontend authority is [`frontend.png`](frontend.png). It governs layout, design system, component hierarchy, responsive direction and visual acceptance. It may be made accessible and production-safe without replacing its visual direction with an independent redesign.

## 2. Explicit exclusions

The following are outside this release and must remain unchanged:

- `work.ssegu.com`: pages, content, migration, design, routes, redirects, DNS and hosting.
- Work/job/recruitment features, including job boards, applications, employer forms and dashboards.
- A second visual design system or Work component/layout/content namespace.
- User accounts, comments, payments and complex personalisation without separate approval.
- Database or R2 integration without a demonstrated requirement and recorded approval.
- Any use of the current `ssegu.com` site as a benchmark, scraper source or migration input.

Migration work may begin only after the project owner supplies a provenance-recorded migration package. The compromised live domain is never a substitute for that package.

## 3. Approved direction

| Area | Baseline |
|---|---|
| Source control | GitHub; repository content and editorial files are version-controlled |
| Application | One Astro application for the main site |
| Language/style | TypeScript and Tailwind CSS |
| Content workflow | Decap CMS with Git-backed content and verified authentication |
| Hosting | Cloudflare Pages; static output by default |
| Server features | Pages Functions only for separately approved requirements |
| Initial media | Optimised repository assets; R2 only after a measured need |
| Search | Build-time index only if approved in Phase 1 |
| Future template | Documented extension boundary only; no implementation now |

## 4. Required launch capabilities

The final release must provide a responsive and accessible main publication, approved editorial routes and content workflow, tested main-site URL preservation/redirects, SEO metadata and discovery files, repeatable GitHub-to-Cloudflare deployment, protected secrets, backups and rollback evidence. Exact routes and migration mappings remain subject to the supplied-data audit.

## 5. Source-of-truth hierarchy

When documents conflict, apply this order:

1. A dated, project-owner-approved change-control record.
2. This scope baseline for release boundary and control rules.
3. [`techspec.md`](techspec.md) for technical requirements and non-negotiable principles.
4. [`implementation-plan.md`](implementation%20phases/implementation-plan.md) for sequencing, deliverables and gates.
5. [`frontend.png`](frontend.png) for frontend visual direction.
6. Phase-specific approved specifications and evidence records.

No lower-level document may expand scope or override an exclusion without a recorded approval.

## 6. Confirmed versus unresolved decisions

Confirmed by the governing specification: main-site-only scope; Work exclusion; Astro/TypeScript/Tailwind; Decap CMS proposal; Cloudflare Pages; static-first delivery; Git-backed content; portable content; no unapproved paid services; no live-domain or Work data dependency; `frontend.png` as design authority.

Unresolved and therefore not silently assumed: final launch route set after URL audit; search inclusion; visual details not represented by the concept; editorial approval model; analytics policy; contact-form requirements; exact Decap authentication arrangement; branch reviewers; Cloudflare project/account ownership; provider limits and pricing.

## 7. Change control

Before implementation proceeds, any change to scope, provider, route, content model, migration source/mapping, security boundary or release acceptance must be recorded in the decision register with date, rationale, owner, impact, affected artefacts and approval status. Until approved, the existing baseline remains controlling.

## 8. Phase 4 amendment

The dated [`phase-4-scope-decision.md`](phase-4-scope-decision.md) records the
approved amendment for Phase 4 fixture frontend work. The consolidated
`new-tech-spec.md` and `implementation-plan.md` govern the `/work/` namespace,
independent Work shell and local fixture routes for this phase. The original
exclusions remain in force for Work production data, DNS, redirects, CMS,
migration, submissions, accounts and backend behavior until their later gates.

