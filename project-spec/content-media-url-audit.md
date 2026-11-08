# Phase 1.2 — Content, Media and URL Audit

**Status:** Synthetic fixture audit complete and approved for fixture development; authoritative audit deferred  
**Prepared:** 7 November 2026  
**Input reviewed:** [`phase-1-input-manifest.md`](phase-1-input-manifest.md)

## Work GitHub source findings

The pinned `posts/` tree contains **84 HTML files**. The records are Work
content—jobs, employment, career/CV advice, freelancing and online courses or
skills—and are not part of the News dataset. Under the consolidated plan they
are the candidate authoritative Work article source and must be migrated only
into Work collections after Phase 7 records the exact GitHub commit/ref,
retrieval date, checksums and rights/media review.

They must never be imported into the main News publication. The current News
dataset remains the separate synthetic placeholder set documented below.

| Audit area | Result | Disposition |
|---|---|---|
| Posts/pages | 84 HTML Work posts | Candidate Work input; verify at Phase 7 |
| IDs/authors/categories | Present in source HTML but not yet normalized | Map to Work schemas; manual review where absent |
| Original URLs/slugs | Canonicals exist in HTML | Preserve/map only after pinned-source audit |
| Titles/descriptions/dates | Present in source HTML | Do not import |
| Media | 84 cover images and repeated image markup; external URLs | Reconcile only after Work rights/source review |
| Embeds/scripts/ads | Inline styles/scripts and third-party references observed | Exclude from application |
| Search Console baseline | Not supplied | Blocked/unavailable |

## Local sample fixture findings

The local sample directory contains **35 synthetic Markdown fixture articles**. Their subjects fit the main publication fixture scope: tourism, culture, lifestyle, business, technology and personal finance. The files contain a single H1 title, article Markdown, source links and occasional Markdown tables. They contain **no frontmatter**, dates, authors, categories, slugs or image references. The directory is therefore usable for content-shape and frontend fixtures, but is not final editorial content and is not sufficient for a final URL or migration inventory.

Fixture metadata is supplied separately in [`sample-article-metadata.csv`](sample-article-metadata.csv). It provides deterministic slugs, fixture descriptions, inferred categories, a fixture author, synthetic dates, fixture status and the shared placeholder image.

All sample articles use [`article-placeholder.svg`](article-placeholder.svg) during implementation. This is a temporary presentation asset, not evidence that original article media is available. It must be replaced with approved media or approved per-article alternatives before handoff.

| Audit area | Result | Disposition |
|---|---|---|
| Sample article count | 35 synthetic Markdown files | Accept only as temporary fixture input |
| Titles/body | H1 plus Markdown body present | Use for fixture validation |
| Dates/authors/categories | No frontmatter found | Add through approved content model before publication |
| Slugs | Filenames provide candidate hints only | Generate only after route rules are approved |
| Images | No Markdown/HTML image references found | Use one shared lightweight placeholder |
| Source links | 133 external Markdown links observed | Preserve as editorial references; validate before publication |
| Tables | 97 Markdown table rows observed | Ensure portable renderer supports tables |

## URL inventory status

No legacy URL receives `preserve`, `map`, `redirect`, `404/410` or `manual-review` disposition yet. The local filenames can become candidate slugs for sample pages, but assigning legacy dispositions requires the approved main-site URL inventory and metadata. The main-site URL inventory must be regenerated from approved main-publication and Search Console/URL sources.

## Exception register

- Dataset separation: all 84 GitHub records are Work content and must not enter News — **critical, enforce separate collections/manifests**.
- Sample metadata gap: 35 local articles have no frontmatter — **high, add schema metadata before publication**.
- Sample media gap: no local article image references — **medium, use one shared placeholder for fixtures and require real media before launch**.
- Media provenance: external Blogger-hosted image URLs are present — **blocked, do not fetch**.
- HTML portability: source contains inline styles, scripts, advertisements, links and embedded presentation — **manual review required for any separately approved dataset**.
- Metadata identity: no trusted structured author/category/content model export was supplied — **blocked**.

## Handoff

Phase 1.2 supports fixture/content-shape work using the local Markdown samples. The complete launch inventory is intentionally deferred until the missing inputs in [`phase-1-input-manifest.md`](phase-1-input-manifest.md) are supplied. Before migration, launch or handoff, the fixture set must be replaced, re-audited and reconciled against the authoritative dataset.

