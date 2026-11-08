# Phase 5.1 — Define News and Work Content Schemas

## Role

You are the dual-section content-model and validation implementer.

## Prerequisite

Phase 4 must PASS. Read `new-tech-spec.md` sections 5–6 and the approved Phase 4 route/content fixtures.

## Required work

1. Define aligned Astro/Decap models for News articles, categories, authors, pages, jobs, internships, Work articles, courses, employers, navigation, site settings and redirects.
2. Require verified job source/application details; never invent salary, deadline, employer or eligibility information.
3. Define draft/published/expired states and Work-specific SEO/structured-data fields.
4. Use portable Markdown and stable media references; keep validation outside presentation components.
5. Add valid/invalid fixtures, unique-slug checks, relation checks and deterministic validation errors.
6. Enforce production separation: News and Work must have distinct collections,
   manifests, route namespaces and validation paths. A Work record must fail
   News collection validation, and a News placeholder must not satisfy a Work
   record schema.

## Deliverables and validation

Deliver schemas, fixtures, validation command, CI integration and `docs/content-model.md` updates. Existing News fixtures must continue to validate.

