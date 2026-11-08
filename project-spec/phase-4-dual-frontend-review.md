# Phase 4 Dual-Frontend Review

**Review date:** 8 November 2026  
**Routes reviewed:** `/`, `/news/`, `/work/`, `/work/jobs/` and representative
Work detail pages  
**Viewport evidence:** 1440×1000 desktop and 390×844 mobile captures from the
local static preview; static HTML smoke checks cover direct route generation.

## Findings and fixes

| Area | Evidence | Result |
| --- | --- | --- |
| Shell boundary | `MainLayout.astro` and `WorkLayout.astro` have separate navigation, footer and class namespaces | Pass |
| Work visual direction | Desktop capture shows the white Work header, navy/yellow hero, image-led advice card, quick links and trust strip from `sseguwork.png` | Pass with accepted asset deviation |
| Responsive behavior | Mobile capture shows the compact Work brand and keyboard-operable menu button; CSS has 640px, 900px and 1250px layout transitions | Pass |
| Job interaction | Headless Chrome query-string review produced `0 opportunities shown` and the deterministic empty state for an unmatched query | Pass |
| Accessibility baseline | Semantic headings, labelled controls, skip link, `aria-current`, `aria-live`, visible focus styles and reduced-motion rules are present | Pass |
| Layout stability | Images have explicit dimensions/aspect ratios; Work content is statically rendered before the filter enhancement | Pass |
| Scope safety | Fixtures are local; no CMS, D1, submission endpoint, migration source or live Work import is present | Pass |

## Accepted deviations

- The repository's approved existing image assets are used for the fixture hero
  and advice card; no live Work media was imported.
- Iconography uses text glyphs in the fixture frontend. A branded icon set can
  be introduced with the later approved content/design work.
- Newsletter and application controls are presentational/deferred and do not
  submit data to an external service.

## Remaining blockers

None for the Phase 4 fixture frontend. CMS, migration, employer-submission and
production redirect work remains intentionally gated by later phases.

