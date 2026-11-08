# Phase 4.1 — Establish Work Scope and Route Boundary

## Role

You are the Work frontend foundation implementer.

## Prerequisite

Read `project-spec/new-tech-spec.md`, `project-spec/sseguwork.png`, the Phase 4 section of `implementation-plan.md`, and the current Phase 3 gate. Confirm the scope-change decision is recorded before changing production-owned routes.

## Required work

1. Create the `/work/` route namespace without changing existing News route behavior.
2. Define explicit ownership for `/work/`, `/work/jobs/`, `/work/jobs/[slug]/`, `/work/internships/`, `/work/career-advice/`, `/work/courses/`, `/work/cv-resources/` and `/work/submit-job/`.
3. Create the Work shell boundary (`WorkLayout.astro`, Work components and Work styles) only where required by the current fixture implementation.
4. Add News-to-Work and Work-to-News navigation without duplicating or replacing the News navigation model.
5. Use fixture data only; do not add CMS, migration, database, external form or redirect behavior in this prompt.
6. Preserve unrelated user changes and do not delete existing News files.

## Validation and deliverables

Deliver a route map, changed-file summary and route smoke checks. Existing News routes must build unchanged, and no dynamic Work route may collide with an existing News article route.

