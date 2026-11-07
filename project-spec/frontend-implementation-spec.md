# Phase 1.4 — Frontend Implementation Specification

**Status:** Concept-derived contract; synthetic local fixtures available  
**Prepared:** 7 November 2026  
**Design authority:** [`project-spec/frontend.png`](frontend.png)

This specification translates the supplied concept into testable frontend requirements. It does not use the compromised live domain as a visual reference and does not create a Work template.

## Visual system

| Token area | Concept-derived direction |
|---|---|
| Brand color | Deep indigo/purple shell, purple active navigation and section accents |
| Alert color | Bright red breaking-news treatment |
| Surface | White/light page background with white cards and subtle cool-gray borders |
| Typography | Strong serif/editorial display treatment for headlines; clean sans-serif utility/navigation text |
| Spacing | Generous page gutters, clear card gaps and visible section separation |
| Borders/elevation | Fine gray rules, restrained card borders and minimal elevation |
| Icons | Simple white/purple utility icons with text labels where needed |
| Editorial hierarchy | Lead story dominates; supporting stories, top-stories ranking and section cards provide secondary paths |

## Shared shell

1. Utility bar: date/calendar, weather/location, and links such as About, Contact and Advertise; social/search controls remain keyboard accessible.
2. Masthead: SSEGU logo/tagline and wide Uganda/city promotional banner area.
3. Primary navigation: Home active state, News, Business, Politics, Technology, Education, Lifestyle and More; dropdown behavior must be keyboard operable.
4. Breaking-news strip: red label, concise headline and destination link.
5. Footer: main-site navigation, identity, contact/legal links and approved social destinations.

## Page composition

| Page | Required composition |
|---|---|
| Homepage | Shared shell; breaking-news strip; lead story; supporting story stack; Top Stories sidebar; approved promotional/newsletter module; More News; Our Sections |
| Listing/category | Shared shell; page title/category label; ordered article cards; pagination or deterministic continuation; sidebar modules only when approved |
| Article | Shared shell; breadcrumbs; category eyebrow; title/dek; author/date metadata; responsive cover image; readable body; related/recent stories; sidebar on wide screens |
| Static page | Shared shell; clear title; readable constrained body; page-specific contact/form behavior only if approved |
| Search | Shared shell; labelled query field; empty/error/results states; only if search is approved |
| 404 | Shared shell; clear not-found message; useful main-site navigation; no false redirect to homepage |

## Responsive states

- Desktop: multi-column homepage and article layouts with lead content, supporting content and sidebar visible together.
- Tablet: reduce column widths and card density while preserving story order and readable line length.
- Mobile: collapse navigation to an accessible menu; stack lead/supporting/sidebar content; keep breaking-news text readable; preserve image aspect ratios and tap targets.
- All states: no horizontal overflow, reserved image space, visible focus, sufficient contrast and reduced-motion support.

## Component inventory

Main-site components: `UtilityBar`, `Masthead`, `PrimaryNavigation`, `BreakingNews`, `LeadStory`, `StoryCard`, `SupportingStoryList`, `TopStories`, `NewsletterModule` (only if approved), `SectionLinks`, `ArticleMeta`, `Breadcrumbs`, `Footer`.

Genuinely shared primitives may include `BaseLayout`, metadata helpers, accessible disclosure/menu behavior, image wrapper and focus styles. No `work/` components, layouts, styles or content collections are created.

## Acceptance checklist

- [ ] Visual review uses `frontend.png` and representative synthetic fixtures; this does not constitute content sign-off.
- [ ] All fixture articles use [`article-placeholder.svg`](article-placeholder.svg) until real media is approved.
- [ ] Before handoff, replace synthetic fixture articles and placeholder media with the authoritative dataset and repeat content/URL/media review.
- [ ] Heading hierarchy is logical and unique per page.
- [ ] Keyboard users can open/close navigation and reach every link/control.
- [ ] Focus indicators are visible and not clipped.
- [ ] Contrast, alt text, labels, form errors and link names are reviewed.
- [ ] Reduced-motion preference is respected.
- [ ] Responsive states pass at representative mobile, tablet and desktop widths.
- [ ] Images reserve layout space and use useful alternatives.
- [ ] No Work route, component or visual system is introduced.

