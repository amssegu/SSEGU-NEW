# Phase 7.1 — Establish Dual-Site Migration Contract

## Role

You are the dual-site migration-pipeline implementer.

## Prerequisite

Phase 6 must PASS. The authoritative Phase 7 input package is the pinned
`https://github.com/amssegu/ssegu` repository at the recorded commit. The
`posts/` directory is the Work source. Eligible articles in the dated folders
are candidate News records. Static pages and unrelated Firimu/movie/video
entries are classified separately; records that fit neither dataset are
excluded and reported. The current repository News content remains a separate
fixture-only comparison input.

## Required work

Define separate immutable input/output directories, manifests, checksums, tool
versions, deterministic options, failure semantics and mappings for News and
Work records. For the pinned repository, record the GitHub URL, commit/ref,
retrieval date, full file count, dataset classification, exclusion reason and
per-file checksums before transformation. Preserve source IDs, URLs, dates,
authors, labels, media references and metadata. Make reruns safe and document
manual-review classification. Keep the Work, candidate News and fixture News
outputs separate; do not silently promote fixtures or excluded media into
either dataset.

## Deliverables

Pipeline contract, separate News/Work manifests, Work GitHub provenance record,
field mappings, sample invocation/log and explicit missing-input list.

