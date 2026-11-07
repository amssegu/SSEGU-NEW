# Phase 4.2 — Configure Decap CMS and Media Guidance

## Role

You are the Decap CMS configuration and editorial-media implementer.

## Prerequisite

Phase 4.1 schemas/validation exist. Read the approved editorial policy and media strategy.

## Required work

1. Add `public/admin/index.html` and `public/admin/config.yml` for the approved GitHub-backed arrangement.
2. Configure collections matching Astro fields/types/defaults.
3. Exclude `/admin/` from public navigation, sitemap and indexing.
4. Configure media limits/guidance: formats, size, filenames, dimensions, alt text, caption, credit, responsive sizes and no large originals.
5. Configure direct publishing or editorial workflow only according to approved policy; document branch/PR behavior.
6. Restrict access to approved staff and document onboarding/removal.

## Validation

CMS fields round-trip into schema-valid content; invalid entries fail clearly; uploads and metadata follow guidance; admin is not publicly discoverable.

