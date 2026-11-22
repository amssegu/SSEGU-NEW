# Employability Course Catalogue implementation status

Updated: 2026-11-22

## Objective and repository audit

Implement the public catalogue described in `docs/employability-course-catalogue-implementation-brief.md`, using the 50-course shortlist in `docs/course-catalogue-50-research.md`.

- The repository is an Astro 7.4.1 static site using npm and its existing Work routes, shell, layouts and styles.
- The prior course directory relied on imported link data and a minimal editorial collection. Existing Work functionality and the legacy course fixture were preserved.
- Course, pathway and category records use the repository's existing Astro `src/content` collection model with backwards compatibility enabled.
- Astro's generated content module is about 26 MB. Earlier production builds intermittently failed in Vite's parser at varying positions; the current standard production build completed successfully after the publication changes.
- No commit, deployment, external service change or secret access was performed.

## Implemented

- Structured course profiles for all 50 shortlist entries, with source, access, career, local relevance, skills, portfolio, approval and publication-status fields. All 50 were approved for editorial publication by the user's review direction on 2026-11-22.
- All 50 profiles now give a free-versus-paid recommendation with a rationale: 22 free-sufficient, 12 consider-paying, 3 optional, and 13 not-recommended-yet while access or payment terms remain unverified.
- Course pages show the learner-facing free and paid inclusions, followed by the completed recommendation; the two option summaries themselves contain only what each route provides.
- Searchable/paginated course catalogue, category and provider/level/cost/credential filters, individual course pages, category browsing, free-course page and evaluation standards page.
- Twelve staged career pathway drafts with course references, projects, learner suitability and progression sections.
- Human-readable and JSON research ledgers tracking each course's research status, source completeness, last verification date and outstanding work.
- Approved course profiles are published and indexable; unapproved profiles retain draft/noindex handling. Research status remains separate from approval, and provider availability, Uganda checkout, payment terms and job-market coverage remain unverified where noted in the ledger. Pathways remain drafts.
- Responsive viewport review completed in Chrome at 320, 390, 768 and 1,440 px. Fixed secondary-button contrast (white text on white) and removed redundant metadata from narrow course pages; no clipping or horizontal overflow was observed in the reviewed screens.

## Research and publication status

- Inventory: 50 courses.
- In research: 50, including four bounded or replacement entries updated from official provider pages; these retain that research status even though they are approved and published.
- Research required: 0.
- Needs recheck: 0.
- Editorially approved and published: 50.
- Verified as to provider availability, Uganda checkout and all research evidence: not established by publication approval.
- Career pathways implemented: 12 drafts; local and international job evidence and editorial review remain outstanding.

The former scope/availability blockers now have bounded records: Microsoft Productivity Accreditation 2026, HubSpot AEO Fundamentals, an active University of Illinois entrepreneurship specialization, and an OpenLearn Create safeguarding section. The latter three are replacements or related material, not equivalent credentials to their original shortlist entries; their records say so explicitly. These four entries remain under research. Twenty-two relevant course profiles map 23 dated Kampala vacancies across data, IT support, digital marketing, project-office, frontend, bookkeeping and design to covered skills and explicit learner gaps. These examples do not establish broad demand; additional Ugandan and international postings remain outstanding. Uganda checkout/payment access is not confirmed across the inventory.

## Validation

- `npm run check`: passed with 0 errors, warnings or hints after the final frontend changes.
- `npm run validate:content`: passed for 13 collections and 35 legacy fixture rows.
- `npm run build`: passed; 2,306 static pages generated, including 50 course profiles, 10 category detail pages and 12 pathway detail pages.
- Production-output assertion: all 50 approved course records have generated routes, approval/publication labels and no `noindex` directive.
- Work sitemap check: all 50 published course URLs are present.
- `npm run test:e2e`: static route smoke checks passed.
- Responsive screenshots reviewed at 320, 390, 768 and 1,440 px; the free/paid panel and recommendation remain readable at phone width.
- `git diff --check`: passed.

Automated checks do not establish research completeness. No interactive assistive-technology or device-based responsive review has been completed.

## Remaining work

1. Verify course enrollment, free/paid terms, credentials and Uganda checkout individually where the profile marks these unverified.
2. Collect additional dated Ugandan and international job postings, map requested skills to each course and record remaining learner gaps. Current evidence is limited to one or two postings per related profile and some roles require experience well beyond course completion.
3. Complete and review the 12 career pathways before publishing them; the course approval does not approve pathways.
4. Complete assistive-technology testing with a screen reader and inspect source links.

The course profiles are approved and publishable on the production frontend. Their publication does not verify current provider availability, payment terms, Uganda checkout or broad job-market demand. The current production build succeeds; course research and the 12 pathway reviews remain outstanding.

## Run and maintain

- `npm run dev` starts Astro locally.
- Edit course drafts in `src/content/courses/`, pathway drafts in `src/content/pathways/` and categories in `src/content/course-categories/`.
- Update both `docs/course-research-ledger.json` and `docs/course-research-ledger.md` when verifying or changing a course; keep dates and source status aligned with the evidence.
- Run `npm run check`, `npm run validate:content`, `npm test`, `npm run test:e2e` and `npm run build` before considering a release.
