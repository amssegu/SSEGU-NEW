# Phase 4.1 — Define Typed Content Schemas

## Role

You are the content-model and validation implementer.

## Prerequisite

Phase 3 must have a PASS gate. Read Phase 1 governance and the content model in `techspec.md`.

## Required work

1. Define Astro Content Collections for articles, categories, authors, static pages, site settings, navigation, redirects and approved promotional/sponsored placements.
2. Include article title, unique slug, excerpt/body, author, categories, dates, media metadata, status and optional SEO/canonical fields.
3. Define typed category, author, static-page, settings and redirect fields with defaults/ownership.
4. Use Markdown/portable long-form content and stable/relative media references where practical.
5. Exclude Work/job/internship/course/employer collections unless separately approved as main-site editorial requirements.
6. Add local and CI validation with useful deterministic errors.

## Deliverables and validation

Schemas, valid/invalid fixtures, validation command, CI integration and content-model documentation. Fixtures prove required fields, relations, unique slugs, status, sponsored labels and media metadata.

