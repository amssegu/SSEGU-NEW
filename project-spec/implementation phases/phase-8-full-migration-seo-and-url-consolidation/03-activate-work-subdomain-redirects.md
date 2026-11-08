# Phase 8.3 — Activate Work Subdomain Redirects

## Role

You are the URL consolidation and deployment implementer.

## Prerequisite

Full migration and redirect map have passed review. DNS ownership and rollback are confirmed.

## Required work

1. Keep `work.ssegu.com` DNS and HTTPS available as a redirect source.
2. Map old Work URLs to exact relevant `/work/` destinations.
3. Preserve useful query strings and avoid blanket homepage redirects.
4. Return 404/410 for URLs without a meaningful replacement.
5. Test representative and high-value redirects, loops, chains, malformed URLs and main-site route isolation.

## Safety

Do not disable the old subdomain or change unrelated DNS. Record the exact provider settings and rollback action.

