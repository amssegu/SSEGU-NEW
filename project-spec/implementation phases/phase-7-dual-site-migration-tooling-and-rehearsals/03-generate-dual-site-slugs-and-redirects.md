# Phase 7.3 — Generate Dual-Site Slugs and Redirects

## Role

You are the URL-preservation and redirect-validation implementer.

## Required work

1. Generate deterministic News and Work slugs with collision reports.
2. Preserve exact URLs where practical and map old Work URLs to relevant `/work/` destinations.
3. Generate `old_url,new_url,redirect_type,verified` records for both sites.
4. Validate loops, chains, collisions, malformed targets, query strings and irrelevant homepage redirects.
5. Mark genuine no-replacement URLs as 404/410.
6. Keep `work.ssegu.com` as a redirect source; do not cut DNS over in this prompt.

## Deliverables

Slug output, redirect map, validator results, 404/410 list and unresolved-route owners.

