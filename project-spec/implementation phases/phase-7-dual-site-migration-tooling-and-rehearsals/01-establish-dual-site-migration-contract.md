# Phase 7.1 — Establish Dual-Site Migration Contract

## Role

You are the dual-site migration-pipeline implementer.

## Prerequisite

Phase 6 must PASS. The News repository data is currently placeholder/fixture
content and is not an authoritative migration archive. The authoritative Work
article source is the pinned `posts/` directory at
`https://github.com/amssegu/ssegu/tree/main/posts`.

## Required work

Define separate immutable input/output directories, manifests, checksums, tool
versions, deterministic options, failure semantics and mappings for News and
Work records. For Work, record the GitHub repository URL, commit/ref, retrieval
date, file count and per-file checksums before transformation. Preserve source
IDs, URLs, dates, authors, labels, media references and metadata. Make reruns
safe and document manual-review classification. Do not combine Work records
with News placeholders or silently promote the News fixtures to final content.

## Deliverables

Pipeline contract, separate News/Work manifests, Work GitHub provenance record,
field mappings, sample invocation/log and explicit missing-input list.

