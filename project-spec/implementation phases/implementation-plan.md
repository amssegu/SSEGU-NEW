# SSEGU Main Website — Consolidated Phased Implementation Plan

**Status:** Implementation roadmap  
**Source of truth:** `project-spec/techspec.md`  
**Prepared:** 7 November 2026

## 1. Objective and delivery boundary

Rebuild the main SSEGU publication website as a maintainable, static-first Astro application backed by GitHub, Decap CMS and Cloudflare Pages. The completed release must provide a responsive and accessible editorial website, a reliable publishing workflow, verified migration of main-site content, protected legacy URLs, and repeatable deployment and rollback procedures.

This plan deliberately excludes `work.ssegu.com`, its content, its DNS, its redirects, its job/recruitment features, and any second visual template. The existing `ssegu.com` domain is considered compromised and broken; it is not a product benchmark, data source, or migration input. Migration data will be supplied and audited during the migration phase.

`project-spec/frontend.png` is the approved design concept and the frontend source of truth for this release. It dictates the page layout, design system, visual hierarchy, component composition, responsive direction and frontend acceptance criteria. Implementation may make the concept production-safe and accessible, but must not replace its visual direction with an independent redesign.

The repository is currently specification-only: `project-spec/techspec.md`, `project-spec/frontend.png`, and `README.md` are present, with no application implementation to preserve.

## 2. Target architecture

```text
GitHub repository
  ├─ Astro + TypeScript + Tailwind application
  ├─ Decap CMS configuration and Git-backed content
  ├─ migration, redirect, content-audit and validation scripts
  └─ deployment and operational documentation
          │
          ├─ PR preview → Cloudflare Pages preview
          └─ protected production branch → Cloudflare Pages production

Main site
  ├─ shared foundations: metadata, validation, accessibility primitives, config
  ├─ main presentation: layouts, components, styles and routes
  └─ content: articles, categories, authors, pages and site configuration

Future Work/second template
  └─ documented extension boundary only; no code, content or routes in this release
```

Default decisions:

- Astro static generation for ordinary editorial pages.
- TypeScript and schema validation throughout application and content code.
- Tailwind CSS, with main-site styles kept separate from future template concerns.
- Decap CMS at `/admin/`, using GitHub-backed content and a verified authentication flow.
- Optimised repository media initially; Cloudflare R2 only after a measured media-storage need.
- Build-time search index if search is confirmed in the approved route scope.
- No database, user accounts, payments, comments, recruitment workflows or custom server endpoints unless a separately approved requirement proves they are needed.

## 3. Delivery principles

1. Main SSEGU website only; Work remains outside the release boundary.
2. Treat the supplied migration export and inventories as authoritative inputs once provided; do not scrape or reuse the compromised live domain.
3. Preserve important main-site URLs and search value through evidence-based route mapping and tested redirects.
4. Keep content portable, version-controlled and restorable.
5. Prefer static HTML and minimal browser JavaScript.
6. Add abstraction only where it serves the current site or creates a clear, documented extension point.
7. Never commit secrets, private tokens, personal data or unreviewed migration output.
8. Every phase has an exit gate; later phases do not compensate for an unresolved earlier gate.
9. Production readiness means tested behavior, security, performance, accessibility, SEO, operations and rollback—not merely a successful build.

## 4. Cross-phase workstreams and ownership

| Workstream | Primary responsibility | Required outputs |
|---|---|---|
| Product and scope | Project owner + technical lead | Approved route scope, content rules, out-of-scope decisions |
| Editorial | Editor/content owner | Content model, category/author rules, publishing acceptance |
| Design/frontend | Frontend implementer | Responsive main-site experience, layouts, components and styles |
| Migration/SEO | Migration implementer + SEO reviewer | Inventory, transformed content, redirect map, validation reports |
| Platform/operations | Technical lead | GitHub, Cloudflare, secrets, CI/CD, backups, rollback and monitoring |
| Quality/security | Reviewer/QA owner | Automated/manual test evidence and release sign-off |

## 5. Phased implementation roadmap

### Phase 0 — Project control and preconditions

**Purpose:** Establish a safe working baseline before implementation begins.

**Tasks**

- Confirm the repository owner, GitHub organisation/repository, production branch and reviewer permissions.
- Confirm that the supplied `techspec.md` is the governing scope document.
- Record the explicit exclusion of Work routes, content, DNS, redirects and design.
- Create an issue/milestone structure matching the phases in this plan.
- Decide the minimum launch route set from the spec, pending the main-site URL audit.
- Record open decisions: final visual direction, search inclusion, editorial approval model, analytics policy and contact-form requirements.
- Establish a decision log for changes to scope, providers, content model and routes.

**Deliverables**

- Approved scope and decision log.
- GitHub access and branch-protection plan.
- Risk register with owners.
- Open-decision list with due dates.

**Exit gate**

- The team can identify the current release boundary, decision owner and acceptance owner.
- No task in the active backlog requires Work data or the compromised live site.

### Phase 1 — Discovery, supplied-data intake and information architecture

**Purpose:** Replace assumptions with an audited understanding of the main publication before routes or migration code are finalised.

**Tasks**

- Receive and checksum the migration data package when provided; preserve the original package read-only.
- Audit the main-site export and supplied inventories for posts, pages, authors, labels/categories, dates, images, embeds, canonical metadata and special markup.
- Build a complete URL inventory from the supplied migration sources and approved Search Console/export data. Do not use the compromised live domain as a data source.
- Classify each source URL as preserve, map, redirect, 404/410, or manual-review required.
- Identify slug collisions, duplicate content, missing media, unsupported embeds, malformed HTML and content requiring editorial review.
- Define the information architecture: homepage, news/listing, category, article, search (if approved), static pages, RSS, sitemap, admin and 404.
- Define navigation and internal-linking rules for the main publication only.
- Treat `frontend.png` as the approved frontend design concept and convert it into an implementation specification: masthead, top utility bar, primary navigation, breaking-news treatment, lead story, supporting story modules, sidebar modules, typography, color tokens, spacing, borders, icon treatment, editorial card hierarchy and responsive behavior.
- Define content governance: required fields, publication status, author/category ownership, sponsored-content labeling and image standards.

**Deliverables**

- Main-site content inventory.
- Main-site URL and redirect inventory.
- Media and special-content exception report.
- Approved route map and navigation specification.
- Content-model and editorial-governance document.
- Frontend implementation specification derived from the approved design concept, including design tokens, component inventory, page composition and responsive states.

**Exit gate**

- Every important supplied main-site URL has a proposed disposition.
- Route patterns, content types and launch navigation are approved.
- Migration exceptions are known well enough to estimate manual review.

### Phase 2 — Repository, toolchain and deployment foundation

**Purpose:** Create a deployable, testable application skeleton before feature work.

**Tasks**

- Bootstrap Astro with TypeScript and Tailwind.
- Add the agreed package scripts for development, formatting, linting, type checking, unit tests, end-to-end tests, content validation, build and preview.
- Create the documented structure from the spec: `src/components/main`, `src/components/shared`, `src/components/ui`, layouts, pages, content, styles, libraries and scripts.
- Add base configuration, environment-variable validation and safe `.gitignore` rules.
- Configure GitHub branch protection, pull-request review and required CI status checks.
- Configure Cloudflare Pages preview and production builds using the verified Astro build/output settings.
- Keep the deployment static by default; introduce Pages Functions only for a confirmed server-side requirement.
- Document public configuration versus secrets and establish separate local, preview and production environments.
- Document the future template boundary without creating Work files or placeholder routes.
- Add baseline security headers and deployment-safe defaults after validating them against required third-party services.

**Deliverables**

- First Astro application commit.
- Passing local build and preview deployment.
- GitHub CI workflow for install, lint/type checks, tests and build.
- Cloudflare preview deployment.
- `docs/deployment.md`, environment documentation and future-template notes.

**Exit gate**

- A clean checkout installs with `npm ci`, passes baseline checks and builds successfully.
- A pull request produces a reviewable Cloudflare preview.
- No secret is present in the repository or generated client bundle.

### Phase 3 — Design system, accessibility baseline and main-site frontend

**Purpose:** Implement the approved main publication experience with a stable, reusable foundation.

**Tasks**

- Establish brand tokens for color, typography, spacing, borders, elevation and responsive breakpoints.
- Implement `BaseLayout` for document structure, language, metadata slots, skip link, global styles and shared accessibility behavior.
- Implement `MainLayout` and main-site header, utility bar, navigation, footer and responsive menu.
- Build homepage modules reflected in the approved design brief: lead story, supporting stories, category labels, latest/top stories, newsletter or promotional modules only where approved, and section navigation.
- Build article, category/listing, static-page, search, RSS, sitemap and 404 routes required by the approved route map.
- Keep content queries, sorting, pagination and transformations out of presentation components.
- Implement typed content accessors and deterministic empty/error states.
- Use semantic HTML, keyboard-operable controls, visible focus, logical headings, useful image alternatives, reduced-motion support and sufficient contrast.
- Optimise image dimensions and formats, reserve layout space, lazy-load non-critical media and avoid unnecessary client-side JavaScript.
- Validate representative mobile and desktop layouts against the approved `frontend.png` design concept, not against the compromised live site.

**Deliverables**

- Complete navigable main-site frontend using fixture/sample content.
- Main-site design tokens, component conventions and approved-concept fidelity notes.
- Responsive behavior and accessibility notes.
- Route smoke tests and initial visual review record.

**Exit gate**

- All approved routes render with representative content.
- Main navigation and footer work by keyboard and at mobile widths.
- No Work route, component namespace, content collection or navigation item has been introduced.
- Baseline static checks pass and no known blocker remains in the frontend review.

### Phase 4 — Content schemas, Decap CMS and editorial workflow

**Purpose:** Prove that a non-developer can safely manage content before any bulk migration.

**Tasks**

- Define Astro Content Collections and schemas for articles, categories, authors, static pages, site settings, navigation, redirects and approved configurable promotional/sponsored placements.
- Keep CMS field names, types, required values and defaults exactly aligned with Astro schemas.
- Add Decap CMS under `/admin/`; exclude it from public navigation, sitemap and indexing.
- Prototype the selected GitHub authentication arrangement early, including OAuth callback/proxy requirements, local and production callback URLs, failure states and secret storage.
- Configure editorial workflow: direct publishing or draft branch/PR review, based on the approved editorial policy.
- Configure media upload guidance and validation: file-size limit, supported formats, filenames, dimensions, alt text, caption and credit fields.
- Restrict repository and CMS access to approved staff; document onboarding and removal.
- Add content validation to local development and CI so invalid CMS changes fail before deployment.
- Test draft visibility, preview behavior, publication, editing, correction and restoration through Git history.

**Editor acceptance test**

An identified non-technical editor must log in, create an article, add an image, select author/category, preview, save a draft, edit, publish, correct a mistake and restore an earlier version without developer intervention.

**Deliverables**

- `public/admin/index.html` and `config.yml`.
- Content schemas and validation commands.
- Verified authentication and editorial workflow.
- Editor runbook and completed usability-test record.

**Exit gate**

- The editor acceptance test passes.
- Drafts are not publicly visible.
- Callback errors, permission failures and invalid content produce understandable outcomes.
- Authentication secrets are stored only in the appropriate environment secret store.

### Phase 5 — Migration tooling and rehearsals

**Purpose:** Make migration repeatable, reviewable and reversible before importing the full archive.

**Tasks**

- Implement an idempotent migration pipeline under `scripts/` that accepts the supplied export package without modifying it.
- Parse source posts/pages, preserve source IDs/URLs, dates, authors, labels and available metadata, and map them into the approved content model.
- Convert HTML to Markdown or the chosen portable representation while flagging tables, embeds, captions, unusual layouts, scripts and unsupported markup.
- Reconcile media using a manifest; download or copy only from approved supplied sources, detect duplicates and flag missing assets.
- Generate deterministic slugs and a collision report; require explicit resolution for ambiguous routes.
- Generate `old_url,new_url,redirect_type,verified` redirect data and validate loops, chains, collisions and irrelevant homepage redirects.
- Produce a migration report containing counts, failures, manual-review items, missing media, URL coverage and content-model exceptions.
- Run a small pilot import through the actual CMS/content validation/build path.
- Have editorial reviewers inspect representative articles across categories, dates, media types, embeds and formatting complexity.

**Deliverables**

- Blogger/source import utility.
- Media manifest and reconciliation utility.
- Redirect map and validator.
- Migration report format.
- Pilot dataset and review findings.
- `docs/content-model.md` and migration runbook.

**Exit gate**

- The pilot is reproducible from the original supplied input.
- No unresolved critical URL, content-loss or security issue remains.
- Editorial reviewers approve the conversion rules and manual-review process.
- The migration can be rerun without duplicating content or silently overwriting reviewed corrections.

### Phase 6 — Full migration, SEO implementation and content sign-off

**Purpose:** Import the approved main-site archive and make discovery behavior production-safe.

**Tasks**

- Run the migration pipeline against the complete supplied dataset in a controlled branch/environment.
- Resolve or explicitly disposition all critical and high-priority migration exceptions.
- Manually review representative and high-value pages, all static pages, featured content, media-heavy posts, embeds and any content affecting legal/editorial obligations.
- Validate dates, authors, categories, slugs, canonical overrides, image alt/caption/credit data and publication status.
- Implement and validate page titles, descriptions, canonical URLs, Open Graph metadata, Article/Breadcrumb JSON-LD where applicable, RSS, sitemap and robots rules.
- Ensure `/admin/` and other non-public paths are not indexed.
- Implement redirects only for the main site, with permanent redirects where appropriate; do not touch Work subdomain redirects.
- Verify 404/410 behavior for genuinely unavailable content and preserve useful query parameters where required.
- Generate a before/after URL coverage report and obtain editorial/SEO sign-off.

**Deliverables**

- Migrated main-site content and media.
- Final reviewed redirect map.
- SEO metadata and structured-data implementation.
- Migration and URL-coverage reports.
- Signed content acceptance record.

**Exit gate**

- All important supplied URLs are preserved or mapped to relevant destinations.
- No known redirect loops/chains or accidental Work changes exist.
- Sitemap, canonical, structured-data, robots and 404 checks pass.
- Editorial owner accepts the migrated content quality.

### Phase 7 — Integrated quality, security, performance and operational readiness

**Purpose:** Exercise the production system as a real public site and editor workflow.

**Test layers**

- Unit/component tests for content utilities, slug/URL logic, redirect validation, metadata and search indexing.
- Integration tests for content loading, build output, CMS-compatible content and deployment configuration.
- End-to-end tests for homepage navigation, category → article journeys, search, 404, responsive menu, keyboard navigation and editor publishing where the test environment allows it.
- Cross-browser and responsive checks on representative mobile and desktop viewports.
- Accessibility checks with automated tooling plus manual keyboard, focus, heading, landmark, screen-reader-name and reduced-motion checks.
- SEO checks for titles, descriptions, canonical URLs, robots, sitemap, structured data, internal links and indexability.
- Performance checks under realistic mobile/network conditions. Treat LCP ≤ 2.5s, INP ≤ 200ms and CLS ≤ 0.1 as targets; measure rather than claim them from source inspection.
- Security checks for dependency vulnerabilities, exposed secrets, unsafe HTML/Markdown handling, CMS access, callback configuration, headers, preview/production isolation and sensitive logging.
- Build/deploy checks for clean checkout, preview deployment, production build, cache behavior and rollback.
- Backup restore rehearsal for source, content, media, redirect map and configuration documentation.

**Release gates**

- Standard: lint, type check, tests, build, no high/critical dependency or secret findings.
- Strict: meaningful coverage for new logic, security review, performance evidence, responsive/E2E evidence and documentation review.
- Critical launch: rollback tested, monitoring/alerts or operational signals defined, stakeholder sign-off and production DNS/configuration checklist complete.

**Deliverables**

- QA matrix with evidence and environment.
- Accessibility, SEO, performance and security reports.
- Release quality-gate report.
- Backup/restore record.
- Production runbook and rollback runbook.

**Exit gate**

- No blocker or critical issue is open.
- Any accepted warning has an owner, rationale and follow-up date.
- All required acceptance criteria in `techspec.md` are evidenced.

### Phase 8 — Launch, verification and stabilization

**Purpose:** Move the main site to production safely and monitor the migration outcome.

**Tasks**

- Freeze and tag the release commit; archive the final migration input, output reports and redirect map.
- Confirm Cloudflare Pages production settings, custom domain, TLS, caching, build command, environment variables and secrets.
- Confirm the launch rollback target and exact recovery steps.
- Deploy during an agreed window and run smoke tests for homepage, representative articles, categories, static pages, search, RSS, sitemap, robots, admin access and 404 behavior.
- Run redirect probes for the highest-value URL set and sample the complete redirect map.
- Submit/refresh the sitemap in Search Console using the approved property; record verification status.
- Monitor deployment logs, build failures, 4xx/5xx responses, redirect misses, crawl errors, broken media and editor reports.
- Compare post-launch technical and search signals with the available pre-migration baseline; do not infer ranking success from one early observation.
- Fix launch blockers immediately; log non-blocking issues for stabilization.

**Exit gate**

- Production smoke test passes.
- Rollback remains available and documented.
- Search Console and operational monitoring are active.
- The site is stable through the agreed observation window and ownership is handed over.

### Phase 9 — Post-launch maintenance and controlled evolution

**Purpose:** Keep the production site healthy without reintroducing scope creep.

**Recurring controls**

- Weekly: review deployment failures, broken links, editor issues, crawl errors and quota usage.
- Monthly: dependency updates, full Lighthouse/quality review, accessibility spot checks, performance review and backup verification.
- Quarterly or after major change: restore rehearsal, redirect audit, content-model review, threat review and provider-plan review.
- Track repository/media growth and decide on R2 only when measured size, build time or editorial needs justify the integration cost.
- Reassess advanced search, analytics, email or server-side features only through a new approved requirement.

**Exit/continuation rule**

- The main-site release is complete when launch gates pass; Work or a second template requires a separate discovery and approval cycle.

## 6. Dependency and sequencing map

```text
Phase 0
  ↓
Phase 1: supplied data + route/content/design decisions
  ↓
Phase 2: deployable foundation
  ↓
Phase 3: frontend using fixture content ─────┐
  ↓                                          │
Phase 4: CMS/editor proof ───────────────────┤
  ↓                                          │
Phase 5: migration rehearsal ────────────────┘
  ↓
Phase 6: full migration + SEO
  ↓
Phase 7: integrated release gates
  ↓
Phase 8: production launch + stabilization
  ↓
Phase 9: maintenance and separately approved evolution
```

The CMS editor test and migration pilot are hard gates before bulk migration. URL mapping and content sign-off are hard gates before production cutover. No provider integration should be treated as complete until success, failure, permission and rollback behavior have been tested.

## 7. Production-ready repository target

The implementation should converge toward this structure without creating unused Work code:

```text
public/
├── admin/index.html
├── admin/config.yml
├── uploads/
├── favicon.svg
└── robots.txt

src/
├── components/
│   ├── main/
│   ├── shared/
│   └── ui/
├── layouts/
│   ├── BaseLayout.astro
│   └── MainLayout.astro
├── pages/
├── content/
├── styles/
├── lib/
└── content.config.ts

functions/                  # only if an approved server feature requires it
scripts/
├── blogger-export/
├── migrate-content/
├── validate-redirects/
└── audit-content/
docs/
├── migration-map.csv
├── content-model.md
├── deployment.md
├── future-template-notes.md
├── editorial-workflow.md
├── operations.md
└── rollback.md

.github/workflows/
astro.config.mjs
package.json
tsconfig.json
wrangler.toml               # only with verified Cloudflare configuration
README.md
```

## 8. Final production-readiness checklist

### Scope and architecture

- [ ] Only the main SSEGU site is implemented.
- [ ] No Work content, pages, routes, components, redirects or DNS changes exist.
- [ ] Main-site and shared foundations are separated without speculative subsystems.
- [ ] Future template boundary is documented.

### Content and CMS

- [ ] Content schemas and CMS fields agree.
- [ ] Editor login, preview, draft, publish, edit and restore workflows pass.
- [ ] Invalid content fails clearly before deployment.
- [ ] Media limits, alt text, captions, credits and optimization guidance are documented.

### Migration and SEO

- [ ] Supplied migration sources are archived and reproducible.
- [ ] Important main-site URLs are accounted for.
- [ ] Redirects are relevant, loop-free and verified.
- [ ] Sitemap, robots, canonical, metadata, structured data, RSS and 404 behavior pass.
- [ ] Search Console baseline/post-launch monitoring is configured.

### Security and operations

- [ ] No secrets or sensitive migration data are committed.
- [ ] Repository, CMS, preview and production permissions are least-privilege.
- [ ] Dependency and security checks pass with no unresolved high/critical issue.
- [ ] Backups exist and a restore has been tested.
- [ ] Logs and operational signals omit secrets and unnecessary personal data.
- [ ] Rollback procedure is documented and tested.

### Frontend quality

- [ ] Responsive layouts faithfully implement the approved `project-spec/frontend.png` concept across representative mobile and desktop states.
- [ ] The approved concept's masthead, navigation, breaking-news bar, lead-story composition, supporting story modules, sidebar modules, typography, color system and spacing hierarchy are implemented consistently.
- [ ] Keyboard, focus, semantics, contrast, headings, alt text and reduced-motion behavior pass review.
- [ ] Representative pages meet agreed performance targets or have explicitly accepted, tracked exceptions.
- [ ] Browser console and build output are free of release-blocking errors.

### Release

- [ ] CI passes on the release commit.
- [ ] Cloudflare preview and production deployments are verified.
- [ ] Custom domain, TLS, headers and caching are verified.
- [ ] Production smoke tests and redirect probes pass.
- [ ] Stakeholder/editor/technical sign-offs are recorded.

## 9. Explicitly deferred work

The following must not be pulled into this release without a new approved scope:

- Work-site assessment, migration, design, routes, redirects or employer/job features.
- A second visual template implementation.
- User accounts, comments, payments or personalization.
- Database-backed content or application data.
- R2 media migration before repository-media limits justify it.
- Paid search, analytics, email or other provider dependencies without approval.

Any future Work or second-template project should begin with its own discovery, threat/risk review, information architecture, design, migration mapping and acceptance criteria.
