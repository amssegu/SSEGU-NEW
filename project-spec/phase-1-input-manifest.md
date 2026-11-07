# Phase 1.1 — Supplied Input Manifest and Provenance

**Status:** Synthetic fixture input approved for continued development; authoritative dataset deferred  
**Prepared:** 7 November 2026  
**Source owner:** Andronicus Enoch M.  
**Repository:** [`amssegu/ssegu`](https://github.com/amssegu/ssegu/tree/474cea16ebf0dd6c8fc5e4ea7d7c5b45e2277fd8/posts)  
**Source commit:** `474cea16ebf0dd6c8fc5e4ea7d7c5b45e2277fd8`  
**Local preservation:** Read-only shallow sparse checkout used under `/tmp/ssegu-phase1-source`; source files were not modified or copied into the application repository.

**Deterministic checksum of sorted per-file SHA-256 output:** `d3aee9c14a3fbff38f59e856edf2b42d57a23b8a358920e4d67f6009fa2c1bee`

## Input record

| Input | Format | Observed contents | Integrity/provenance |
|---|---|---|---|
| `posts/` | 84 standalone HTML files | Employment, visa sponsorship, career/CV, freelancing and online-course articles | Git commit SHA above; remote tree and file paths are reproducible |
| Article metadata | HTML `<title>`, description, canonical, Open Graph fields | Present in all 84 inspected files | Counted from the read-only checkout |
| Article media | External image URLs in HTML | One cover image per file; 168 `<img>` tags total including repeated site/cover markup | No media package supplied locally |
| Local sample articles | 35 Markdown files under `content/articles/` | Main-site fixture topics grouped by month/week directories | Read-only local input; no frontmatter or image references |

The local sample source is:

`/mnt/863d24d6-655d-406d-9cd6-e39caff13506/choneize tools/ssegu content/articles/`

Its sorted per-file SHA-256 output has aggregate checksum `f688693c9ba5709ef28d4e256b8b3225a489c9b190f52f1c079304d620481715`. The 35 files are synthetic/sample fixtures for discovery and frontend/content validation, not an authoritative archive or migration package.

For the temporary fixture presentation, all 35 articles will reference one shared lightweight placeholder image: [`article-placeholder.svg`](article-placeholder.svg). The placeholder must be stored once in the application media area during Phase 2 and referenced consistently. Neither the sample copy nor the placeholder image may be treated as final editorial content or final media.

Fixture metadata is defined in [`sample-article-metadata.csv`](sample-article-metadata.csv). It uses deterministic filename-derived slugs, synthetic dates, the placeholder author `SSEGU Editorial Desk (fixture)`, inferred editorial categories, `status=fixture`, and the shared placeholder image. These values are suitable for development only and must be replaced or reviewed when the authoritative dataset arrives.

The package-level reproducibility command is:

```text
git clone --depth 1 --filter=blob:none --sparse https://github.com/amssegu/ssegu.git source
git -C source sparse-checkout set posts
git -C source checkout 474cea16ebf0dd6c8fc5e4ea7d7c5b45e2277fd8
find source/posts -type f -print0 | sort -z | xargs -0 sha256sum
```

The 84 source files are intentionally not copied into this repository. Their complete authoritative file list is the pinned GitHub tree above. Any future audit must use the same commit or record a new commit and checksum manifest.

## Data dictionary

| Field/input | Meaning | Current handling |
|---|---|---|
| Filename | Source filename and likely legacy slug hint | Inventory identifier only; no route approved |
| `<title>` | Browser/search title | Not imported; requires main-site scope approval |
| `meta description` | Search description | Not imported |
| Canonical URL | Source canonical reference | Not treated as an approved URL mapping |
| Open Graph fields | Social title, description and image | Not imported |
| Article body HTML | Long-form source content and embedded markup | Not imported; requires editorial/content approval |
| `<img>` URLs/alt | Media references and alternatives | Not imported; media provenance/download permission absent |
| Embedded scripts/styles/links | Presentation, advertising and external dependencies | Exception evidence only; never copied as runtime code |

## Missing or blocked inputs

| Missing input | Owner | Next action | Status |
|---|---|---|---|
| Authoritative main-publication content export | Andronicus Enoch M. | Supply the approved dataset; replace all synthetic fixture content before handoff | Deferred; not a fixture-development blocker |
| Main-site URL inventory/Search Console export | Andronicus Enoch M. | Supply approved export before migration/launch or explicitly record unavailable data | Deferred; not a fixture-development blocker |
| Main-site media package/manifest | Andronicus Enoch M. | Use the single approved lightweight placeholder for fixtures; supply real media inventory/rights before migration or launch | Deferred for fixtures; placeholder approved |
| Analytics baseline | Andronicus Enoch M. | Supply approved export or record unavailable baseline | Open |
| Author/category/label inventory | Andronicus Enoch M. | Supply with the main-publication package | Blocked |

No `work.ssegu.com` data, routes, redirects, DNS or design was used. The GitHub `posts/` package is classified as out-of-scope Work/job/career/course material and must not be imported. The local Markdown directory is recorded as synthetic sample main-site fixture content only and must be replaced/re-audited before handoff.

