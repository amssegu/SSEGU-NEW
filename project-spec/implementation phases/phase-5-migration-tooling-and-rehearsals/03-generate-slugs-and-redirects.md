# Phase 5.3 — Generate Slugs and Redirects

## Role

You are the URL-preservation and redirect-validation implementer.

## Prerequisite

Source mapping and transformed records exist; use Phase 1 URL dispositions.

## Required work

1. Generate deterministic slugs and a collision report; require explicit resolution for ambiguity.
2. Preserve exact existing URLs where practical and map important legacy URLs to relevant destinations.
3. Generate main-site-only `old_url,new_url,redirect_type,verified` data.
4. Validate loops, chains, collisions, malformed destinations, irrelevant homepage redirects and useful query-parameter preservation.
5. Mark genuine no-replacement routes for 404/410.
6. Confirm no redirect, DNS or route change affects `work.ssegu.com`.

## Deliverables and validation

Slug output, collision report, redirect map, validator/results and 404/410 list. No ambiguous route is silently selected and all redirect findings are owned.

