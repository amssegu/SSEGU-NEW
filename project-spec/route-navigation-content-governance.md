# Phase 1.3 — Route, Navigation and Content Governance

**Status:** Fixture-development contract approved; launch routes remain pending authoritative audit  
**Prepared:** 7 November 2026  
**Authority:** `techspec.md`, implementation plan and approved main-site scope baseline

## Provisional route map

These are implementation candidates from the technical specification, not final URL decisions. Final article routes and redirects require the approved main-site URL inventory.

| Route | Type/owner | Acceptance rule | Status |
|---|---|---|---|
| `/` | Homepage / editorial owner | Main-site lead, supporting stories and approved sections render | Provisional |
| `/news/` | Listing / editorial owner | Published main-site articles list deterministically | Provisional |
| `/category/{slug}/` | Category / editorial owner | Approved category resolves without collision | Provisional |
| `/{article-slug}/` | Article / editorial owner | Audited source maps to one relevant article | Provisional |
| `/search/` | Search / project owner | Include only after explicit search decision and index test | Open decision |
| `/about/`, `/contact/`, `/privacy/`, `/terms/` | Static pages / project owner | Approved copy and metadata are present | Provisional |
| `/rss.xml` | Discovery / technical lead | Published article feed validates | Provisional |
| `/sitemap-index.xml` | Discovery / technical lead | Public main-site URLs only; admin excluded | Provisional |
| `/admin/` | CMS / technical lead | Authenticated CMS only; absent from navigation/indexing | Provisional |
| `/404` | Error / technical lead | Helpful non-indexable not-found response | Provisional |

The original main-site-only contract did not approve Work routes. That boundary
is amended for Phase 4 fixture frontend work by
[`phase-4-scope-decision.md`](phase-4-scope-decision.md); the complete Work
route map is recorded in [`phase-4-route-map.md`](phase-4-route-map.md).
Production Work data, employer workflow and `work.ssegu.com` redirects remain
outside this amendment.

## Navigation and linking rules

- Header and footer navigation contain main-publication destinations only.
- Navigation data remains separate from presentation where practical.
- Category visibility, order and labels require editorial approval after the main-site category inventory arrives.
- Article links must resolve to approved main-site routes; no Work links are introduced by migration.
- Breadcrumbs reflect the approved main-site hierarchy and never invent a category for unresolved content.
- External links retain their destination and are reviewed for editorial/safety concerns.

## Content governance contract

Articles require title, slug, body, published date, author where applicable, category, publication status and useful image alt text. Excerpt, updated date, featured flag, caption, credit, SEO overrides and canonical override are optional but validated when present. Sponsored content must be explicitly labelled. Images must have approved dimensions, descriptive filenames, alt text and preserved caption/credit metadata.

Portable content is Markdown or another documented portable representation with media references kept separate from presentation. Work/job/internship/course/employer collections are excluded.

## Sample fixture route handling

The 35 local synthetic sample articles may be rendered as fixture articles using deterministic slugs derived from their filenames after normalization. Their filename numbers and month/week folders are editorial grouping hints only; they are not legacy URL evidence. Each fixture article receives the shared lightweight placeholder image until approved media is supplied. Fixture routes and content must be replaced or reconciled against the authoritative dataset before handoff; they must not be treated as final URL preservation decisions.

## Unresolved route decisions

Final article path style, category set, search inclusion, navigation ordering, static-page inventory and legacy redirect dispositions remain blocked until the main-publication export and URL/Search Console inventory are supplied.

