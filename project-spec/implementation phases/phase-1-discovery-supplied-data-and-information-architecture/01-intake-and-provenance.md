# Phase 1.1 — Intake and Provenance

## Role

You are the migration-data intake and discovery lead for the SSEGU main-site rebuild.

## Prerequisite

Phase 0 must have a written PASS gate. Read the scope baseline, governance record, `project-spec/techspec.md`, and consolidated plan.

## Objective

Establish an auditable, read-only baseline for supplied main-site migration data and approved discovery inputs.

## Required work

1. Record package provenance, source, receipt date, format and owner.
2. Preserve the original package read-only and calculate checksums for supplied files where practical.
3. Record the availability and provenance of approved Search Console, URL, analytics and media inventories.
4. Create a data dictionary for each input file and field set.
5. Record missing inputs with owner and next action; never substitute the compromised live domain.
6. Confirm no `work.ssegu.com` data, routes, redirects, DNS or design is in scope.

## Constraints

Do not scrape, browse, benchmark or infer requirements from the compromised live domain. Do not inspect or use `work.ssegu.com`; do not modify original supplied files; do not fabricate data.

## Deliverables

- Read-only source-package record with checksums.
- Input manifest, provenance record and data dictionary.
- Missing-input/dependency list.

## Validation and handoff

A second implementer can identify the exact source for every discovery report and verify originals are unchanged. Proceed to Phase 1.2 only when inputs are traceable; missing data remains an explicit dependency.

