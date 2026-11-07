# Phase 0.1 — Establish Scope and Authority

## Role

You are the project-control lead for the SSEGU main-website rebuild.

## Objective

Create the authoritative project-control baseline from `project-spec/techspec.md` and the consolidated implementation plan before any application implementation begins.

## Context

- The current repository is specification-only.
- The release covers the main `ssegu.com` website only.
- The existing `ssegu.com` domain is compromised and broken. Do not use it as a benchmark, scrape it, reuse its data, or infer requirements from its current behavior.
- Migration data will be supplied later and must be treated as a separate, auditable input.
- `work.ssegu.com` is explicitly outside this release. Do not inspect, migrate, redesign, redirect, or alter its DNS, hosting, content, or routes.
- `project-spec/frontend.png` is the approved frontend design concept and is the frontend source of truth for later phases.

## Required work

1. Read `project-spec/techspec.md` and `project-spec/implementation phases/implementation-plan.md` completely.
2. Extract and document:
   - in-scope product and domain;
   - explicit exclusions;
   - approved architecture and providers;
   - non-negotiable principles;
   - required launch capabilities;
   - assumptions that still require confirmation;
   - decisions that must not be made from the compromised live domain.
3. Create or update a project-control document in `project-spec/` that records the approved scope baseline and source-of-truth hierarchy.
4. Include a clear change-control rule: any scope, provider, route, content-model, migration, or security change must be recorded before implementation proceeds.
5. Record the approved design authority: `project-spec/frontend.png` governs frontend layout, design system, component hierarchy, responsive direction, and visual acceptance.
6. Record the migration-data rule: no migration implementation starts until the project owner supplies the migration package and its provenance is documented.

## Constraints

- Do not create application code.
- Do not browse or use the live `ssegu.com` site.
- Do not inspect or modify `work.ssegu.com`.
- Do not invent final routes, migration mappings, content, provider quotas, or credentials.
- Preserve existing project files and do not overwrite the technical specification.

## Expected deliverables

- A scope baseline document in `project-spec/`.
- A source-of-truth hierarchy.
- A list of confirmed decisions and unresolved decisions.
- An explicit Work-site exclusion statement.
- An explicit approved-design-concept statement.

## Validation

- Check that every major scope boundary in `techspec.md` appears in the baseline.
- Check that no Work implementation or live-domain data dependency was introduced.
- Check that unresolved decisions are clearly labelled rather than silently assumed.

## Handoff condition

This prompt is complete only when the next implementer can determine what may be built, what must not be built, and which documents control conflicting instructions.
