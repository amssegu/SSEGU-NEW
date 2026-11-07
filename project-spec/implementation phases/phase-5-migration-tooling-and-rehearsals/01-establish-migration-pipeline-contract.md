# Phase 5.1 — Establish the Migration Pipeline Contract

## Role

You are the migration-pipeline implementer.

## Prerequisite

Phase 4 must PASS and Phase 1 must identify an available, provenance-recorded supplied export. If absent, record a blocked dependency and do not substitute the live domain.

## Required work

1. Define deterministic input/output directories, options, logging and failure semantics under `scripts/`.
2. Parse the main Blogger/XML/Atom export and supplied page/media inventories.
3. Preserve source IDs, original URLs, dates, authors, labels/categories and available metadata.
4. Map records to approved schemas and identify manual-review items.
5. Make reruns safe: no duplicates, silent overwrite or mutation of reviewed corrections.
6. Document provenance, checksums, tool versions and a reproducible sample invocation.

## Constraints and deliverables

Never modify originals, scrape the compromised site, import Work content or silently discard failures. Deliver idempotent utility skeleton, input/output contract, field mapping, runbook and sample logs.

