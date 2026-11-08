# SSEGU Consolidated Implementation Plan — Phase 4 Onward

**Status:** Proposed consolidated plan after main-site Phase 3
**Source of truth:** [`new-tech-spec.md`](../new-tech-spec.md)
**Design authorities:** [`frontend.png`](../frontend.png) for News and [`sseguwork.png`](../sseguwork.png) for Work
**Prepared:** 8 November 2026

## 1. Planning position

Phases 0–3 are treated as the current implementation baseline. The News
section has its Astro foundation, main-site shell, routes and frontend work in
place. The next release must bring the Work section to frontend parity with the
News section before continuing into CMS, employer submissions, migration and
release-readiness work.

The new consolidated product is one website:

```text
https://ssegu.com/       News publication
https://ssegu.com/work/  Employment and opportunities portal
```

The two products share the repository, Astro application, deployment pipeline,
CMS and base accessibility/metadata utilities, but they must retain separate
layouts, navigation, typography, color tokens, component trees and page
compositions.

This plan supersedes the previous plan’s Work exclusion and deferred-Work
section. The scope change must still be recorded in the project decision log
and approved before production routing, DNS, migration or CMS changes are
made.

## 2. Fixed decisions from the new technical specification

- One Astro application and one GitHub repository.
- One primary domain, `ssegu.com`, with Work under `/work/`.
- News and Work use independent visual shells.
- Astro static generation remains the default for public pages.
- Decap CMS manages portable Git-backed editorial content.
- Cloudflare Pages hosts the static site and narrowly scoped Functions.
- Work jobs are manually publishable by editors.
- Employer submissions are accepted into a private review queue; they are
  never published automatically.
- Accounts, applicant profiles, online applications, CV uploads, employer
  dashboards, applicant tracking, payments and comments remain deferred.
- Cloudflare D1 is introduced only for the employer-submission queue if the
  approved implementation requires persistent server-side storage.
- Cloudflare Turnstile and rate limiting protect the public submission form.
- Repository media is the initial storage strategy; R2 requires a measured
  approval.

## 3. Work design acceptance basis

`project-spec/sseguwork.png` is the Work visual source of truth. Phase 4 must
reproduce its structure and visual direction rather than reuse the News shell.
The acceptance review must cover:

- White Work header with SSEGU Work branding and the subtitle
  “Jobs · Careers · Skills · Opportunities”.
- Work-specific navigation for Home, Jobs, Internships, Career Advice,
  Courses, CV Resources and Employers.
- A clear route back to News.
- Navy/royal-blue primary palette with yellow emphasis and purple accents.
- Hero section with career message, supporting image, keyword search, location
  control and popular topic chips.
- Three-column homepage composition: latest opportunities, featured career
  advice and quick links.
- Job cards with employer, location and deadline details.
- Career-advice feature card with category, author/date and call to action.
- Quick links for jobs, courses, career tips and CV resources.
- Career-updates/newsletter presentation, with submission behavior separately
  approved before being made operational.
- Trust/value strip for employers, career advice, skills and workforce impact.
- Responsive, keyboard-operable behavior at mobile and desktop widths.

## 4. Target repository boundary

The implementation should converge toward this structure without creating
unused abstractions:

```text
src/
├── components/
│   ├── main/                 # existing News components during transition
│   ├── news/                 # News-specific components as extracted
│   ├── work/                 # Work-specific components
│   ├── shared/               # genuinely cross-section primitives only
│   └── ui/
├── layouts/
│   ├── BaseLayout.astro
│   ├── MainLayout.astro      # News shell during transition
│   └── WorkLayout.astro
├── pages/
│   ├── ...                   # existing News routes
│   └── work/
│       ├── index.astro
│       ├── jobs/index.astro
│       ├── jobs/[slug].astro
│       ├── internships/index.astro
│       ├── career-advice/index.astro
│       ├── career-advice/[slug].astro
│       ├── courses/index.astro
│       ├── cv-resources/index.astro
│       └── submit-job/index.astro
├── content/
│   ├── articles/
│   ├── categories/
│   ├── authors/
│   ├── jobs/
│   ├── internships/
│   ├── work-articles/
│   ├── courses/
│   └── employers/
├── styles/
│   ├── global.css
│   ├── news.css
│   └── work.css
└── lib/
    ├── content/
    ├── search/
    ├── seo/
    └── validation/

functions/
└── api/
    ├── job-submissions.ts
    └── oauth/callback.ts       # only if required by Decap authentication

migrations/d1/                  # only if D1 is approved
scripts/
├── migrate-content/
├── validate-redirects/
└── audit-content/
```

Keep News and Work presentation code separate. Shared code must be justified by
actual reuse, not by forcing the two designs into one generic template.

## 5. Phased implementation roadmap

### Phase 4 — Work frontend parity and dual-shell completion

**Purpose:** Bring Work to the same implementation maturity as the current
News frontend before introducing CMS or migration behavior.

**Tasks**

1. Record and approve the scope change from main-site-only to consolidated
   News + Work delivery.
2. Add the Work route namespace and explicit route ownership so News article
   slugs cannot collide with `/work/*`.
3. Create `WorkLayout.astro` with Work metadata, header, navigation, footer,
   responsive menu and a visible News return link.
4. Create Work-specific design tokens and styles from `sseguwork.png`; do not
   reuse News color, typography or card rules except for verified primitives.
5. Implement the Work homepage with fixture content:
   - hero search and popular chips;
   - latest opportunities panel;
   - featured career-advice panel;
   - quick-links panel;
   - career-updates panel;
   - trust/value strip.
6. Implement navigable fixture routes for jobs, job detail, internships,
   career advice, courses, CV resources and employer information.
7. Add job search/filter interaction with keyword, location, employment type,
   work arrangement and active/expired state represented in the UI.
8. Add the News-to-Work navigation entry and Work-to-News return route.
9. Keep all Work data fixture-backed and local; do not add CMS, database,
   employer submissions or migration code in this phase.
10. Add route, navigation, responsive and accessibility checks for both shells.

**Phase 4 deliverables**

- Work shell, components, styles and fixture routes.
- Updated shared navigation with explicit News/Work boundaries.
- Work design-fidelity record against `sseguwork.png`.
- Responsive and accessibility review for representative News and Work pages.
- Route collision and smoke-test coverage.

**Phase 4 exit gate**

- `/` and `/work/` visibly operate as distinct products.
- Every proposed Work route resolves with representative content.
- Work navigation and return-to-News navigation work on mobile and desktop.
- Work’s hero, cards, quick links, filters, trust strip and visual hierarchy
  meet the design source review.
- Keyboard, focus, heading, contrast, alt-text and reduced-motion checks pass.
- No CMS, migration or employer-submission dependency is required to review the
  frontend.

### Phase 5 — Unified content model and Decap CMS

**Purpose:** Make both sections editable through one verified editorial system
after both frontend shells are stable.

**Tasks**

- Define Astro schemas and Decap collections for News articles, categories,
  authors, static pages, jobs, internships, Work articles, courses, employers,
  navigation, site settings and redirects.
- Keep CMS field names, types, defaults and required values aligned with the
  Astro schemas.
- Add `/admin/` without exposing it in navigation, sitemap or indexing.
- Configure GitHub OAuth and the required Cloudflare callback/proxy, including
  local, preview and production callback behavior.
- Define editorial workflow: direct publishing or branch/PR review based on the
  approved publishing policy.
- Add media guidance for filenames, dimensions, formats, alt text, captions,
  credits and maximum upload size.
- Add validation so invalid News or Work content fails before deployment.
- Test draft, preview, edit, publish, correction and restore workflows.

**Work content rules**

- Jobs require verified employer, source and application details.
- Salary, deadline, eligibility and employer details must never be invented.
- Expired jobs must not be represented as active vacancies.
- Employer-submitted content remains pending until editorial review and manual
  publication through Decap.

**Phase 5 editor acceptance**

A non-technical editor must be able to log in, create and publish a News
article, create and publish a Work job, add media, preview drafts, edit a
published item, correct a mistake and restore an earlier version.

**Phase 5 exit gate**

- News and Work schemas validate in CI.
- The editor acceptance test passes for both content types.
- Drafts do not appear publicly.
- Authentication failures and invalid content produce understandable outcomes.
- Secrets exist only in the correct environment secret stores.

### Phase 6 — Employer submission workflow

**Purpose:** Add the approved public employer-vacancy intake without creating
accounts or automatic publication.

**Tasks**

- Implement `/work/submit-job/` using the Work shell and design language.
- Validate organisation, contact, job, location, employment type, deadline and
  application fields server-side.
- Add request-size limits, Turnstile verification and rate limiting.
- Store only accepted pending submissions in a private D1 table if D1 is
  approved; do not use D1 as a second CMS.
- Provide a protected operational review path that does not require a custom
  dashboard for v1.
- Allow editors to inspect, verify and manually create approved Job documents
  in Decap.
- Document retention, deletion, abuse handling and optional notification
  behavior.
- Confirm the form works without optional email delivery.

**Phase 6 exit gate**

- Valid submissions reach the private review queue.
- Invalid, oversized and abusive requests are rejected.
- Turnstile and rate limiting are verified.
- Pending submissions never render publicly.
- An editor can review and safely publish an approved vacancy.
- D1 backup/restore or the approved non-D1 operational equivalent is tested.

### Phase 7 — Dual-site migration tooling and rehearsal

**Purpose:** Make migration from both Blogger sites repeatable, reviewable and
reversible before importing the full archive.

**Tasks**

- Receive and checksum read-only exports from both Blogger sites.
- Inventory News and Work posts, pages, labels, dates, authors, media, embeds,
  canonical metadata and Search Console/URL data.
- Map Work content into jobs, internships, Work articles, courses, CV resources
  or explicit manual-review records.
- Preserve source IDs and original URLs.
- Convert HTML to portable Markdown/content files while flagging unsupported
  tables, embeds, scripts, captions and unusual formatting.
- Reconcile media from approved supplied sources only.
- Generate deterministic slugs and collision reports for both sections.
- Generate `old_url,new_url,redirect_type,verified` data for main and Work URLs.
- Produce a migration report with counts, failures, missing media, manual-review
  items and content-model exceptions.
- Run a pilot through the real schemas, CMS-compatible content path and build.
- Review representative News and Work content with editorial owners.

**Phase 7 exit gate**

- Both exports are provenance-recorded and reproducible.
- Important News and Work URLs have dispositions.
- Pilot output does not duplicate content or overwrite reviewed corrections.
- No critical content-loss, URL-loss, rights or security issue remains.

### Phase 8 — Full migration, SEO and URL consolidation

**Purpose:** Publish the approved content and preserve search value while
moving Work into `/work/`.

**Tasks**

- Run the approved migration against the complete dual-site dataset.
- Resolve all critical/high-priority exceptions or record accepted owners and
  follow-up dates.
- Validate News and Work titles, dates, authors, categories, images, credits,
  canonical URLs and publication states.
- Implement separate News and Work sitemap sections, RSS where applicable,
  robots rules, canonical metadata, Open Graph and structured data.
- Add `JobPosting` structured data only for current eligible vacancies.
- Keep expired vacancies out of active JobPosting output.
- Keep `/admin/` and search result routes out of indexing.
- Keep `work.ssegu.com` DNS and HTTPS working as a redirect source.
- Redirect old Work URLs to their corresponding `/work/` destination.
- Redirect old main-site URLs to relevant new destinations.
- Preserve meaningful query parameters and return genuine 404/410 responses
  where no replacement exists.
- Validate loops, chains, collisions and accidental homepage redirects.

**Phase 8 exit gate**

- Important URLs from both sites are preserved or mapped to relevant targets.
- Redirect probes and complete-map validation pass.
- Sitemap, canonical, robots, structured data and 404 checks pass.
- Editorial and SEO owners approve content and URL coverage.

### Phase 9 — Integrated quality, security, performance and operations

**Purpose:** Validate the consolidated site as a production system.

**Test layers**

- Unit tests for schemas, content accessors, search, slugs, redirects and
  metadata.
- Integration tests for News and Work builds, CMS-compatible content and
  Functions configuration.
- End-to-end tests for News navigation, Work navigation, job filters, job
  details, submission errors/success, 404s and CMS workflows where available.
- Responsive and cross-browser checks for both design systems.
- Manual keyboard, focus, heading, landmark, screen-reader-name, contrast and
  reduced-motion checks.
- Security checks for secrets, unsafe content rendering, OAuth, Turnstile,
  rate limiting, D1 access and sensitive logs.
- Performance checks on representative mobile and desktop News and Work pages.
  Use Lighthouse goals of 90+ performance, 95+ accessibility and SEO, LCP under
  2.5 seconds, CLS under 0.1 and INP under 200ms as measured targets, not
  unverified claims.
- Clean-checkout build, preview deployment, production configuration and
  rollback verification.
- Repository, media, redirect-map and D1 backup/restore rehearsal where D1 is
  used.

**Phase 9 exit gate**

- No blocker or critical issue remains open.
- Accepted warnings have an owner and follow-up date.
- Both shell-specific design and shared operational acceptance criteria pass.
- Production secrets, permissions and DNS ownership are verified.
- Rollback is tested and documented.

### Phase 10 — Consolidated launch and stabilization

**Purpose:** Deploy News and Work together and monitor the migration outcome.

**Tasks**

- Freeze and tag the release commit.
- Archive both migration inputs, reports, redirect maps and acceptance records.
- Confirm Cloudflare Pages build, preview, production, TLS, caching, Functions,
  D1 bindings and secrets.
- Confirm old Work subdomain redirect infrastructure remains active.
- Deploy during an agreed window.
- Smoke-test `/`, `/news/`, representative articles, `/work/`, job listings,
  job details, Work content routes, submit-job behavior, RSS, sitemaps,
  robots, admin access and 404 behavior.
- Probe high-value News and Work redirects.
- Submit/update sitemaps and Search Console properties.
- Monitor build failures, 4xx/5xx responses, redirect misses, broken media,
  crawl errors, employer spam and editor reports.
- Fix launch blockers immediately and record non-blocking stabilization work.

**Phase 10 exit gate**

- Both products are stable in production through the agreed observation window.
- Redirects and Search Console monitoring are active.
- Rollback remains available.
- Ownership and operational runbooks are handed over.

### Phase 11 — Controlled maintenance and future expansion

**Recurring controls**

- Weekly: deployments, broken links, crawl errors, editor issues, submissions
  and quota usage.
- Monthly: dependencies, Lighthouse review, accessibility spot checks,
  performance, backups and D1 review where applicable.
- Quarterly or after major changes: restore rehearsal, redirect audit,
  threat/risk review, content-model review and provider-limit review.

**Deferred capabilities**

Accounts, applicant profiles, online applications, CV uploads, applicant
tracking, employer dashboards, saved jobs, payments, advanced search, R2 and
notifications require a separate approved requirement and security review.

## 6. Dependency and sequencing map

```text
Current Phase 3 baseline: News frontend complete
                 |
                 v
Phase 4: Work shell + routes + fixture frontend parity
                 |
                 v
Phase 5: News/Work schemas + Decap CMS + editor acceptance
                 |
                 v
Phase 6: Employer submissions + Turnstile + D1/review queue
                 |
                 v
Phase 7: Both-site migration rehearsal
                 |
                 v
Phase 8: Full migration + SEO + work.ssegu.com redirects
                 |
                 v
Phase 9: Integrated QA, security, performance and operations
                 |
                 v
Phase 10: Consolidated launch + stabilization
                 |
                 v
Phase 11: Maintenance + separately approved expansion
```

Phase 4 is a hard prerequisite for CMS work. The CMS editor test is a hard
prerequisite for bulk migration. The migration and redirect gates are hard
prerequisites for DNS/production cutover.

## 7. Production-readiness checklist

### Scope and architecture

- [ ] Change-control record approves the consolidated News + Work scope.
- [ ] `/work/` is the only approved Work public namespace.
- [ ] News and Work use independent layouts, styles, navigation and components.
- [ ] Shared code is limited to genuine cross-section primitives.
- [ ] Accounts and transactional applicant features remain deferred.

### Work frontend

- [ ] Work homepage matches `sseguwork.png` structure and visual direction.
- [ ] Work routes, navigation, filters and job details work responsively.
- [ ] Work links back to News and News links to Work.
- [ ] Keyboard, focus, semantic, contrast, alt-text and reduced-motion checks pass.

### CMS and content

- [ ] News and Work schemas agree with Decap collections.
- [ ] Editor can publish both an article and a job without developer help.
- [ ] Drafts remain private.
- [ ] Job source, application instructions and verification are reviewed.
- [ ] Media limits, alt text, captions and credits are documented.

### Employer submissions

- [ ] Server-side validation, Turnstile and rate limiting pass.
- [ ] Pending submissions are private and reviewable.
- [ ] No submission publishes automatically.
- [ ] D1 backup/restore is tested if D1 is used.

### Migration and SEO

- [ ] Both Blogger exports are archived with provenance and checksums.
- [ ] Important News and Work URLs have verified dispositions.
- [ ] `work.ssegu.com` redirects to relevant `/work/` routes.
- [ ] No redirect loops, chains or irrelevant homepage redirects exist.
- [ ] Sitemaps, canonical tags, robots, structured data and 404 behavior pass.

### Operations and release

- [ ] Preview and production deployments are verified.
- [ ] DNS, TLS, Functions, D1 bindings and secrets are verified.
- [ ] No secret or sensitive submission data is committed.
- [ ] Backups and restore procedures pass.
- [ ] QA, editorial, SEO, security and release sign-offs are recorded.
- [ ] Rollback is tested and documented.
