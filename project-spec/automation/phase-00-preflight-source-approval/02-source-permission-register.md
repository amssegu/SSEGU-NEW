# Phase 00 / Prompt 02 — Build the source permission register

Using `project-spec/sources.txt` and current official source terms, create a reviewable permission register at `project-spec/automation/phase-00-preflight-source-approval/source-permission-register.md`.

For every candidate source record: source type, exact endpoint, terms URL, date checked, permission class, commercial/ad-supported suitability, permitted fields, attribution, rate limits, credentials/appname requirements, expiry rules, source-specific SEO restrictions, and enabled/disabled status.

Do not infer permission from public accessibility or `robots.txt`. Keep all sources disabled unless the evidence meets the specification. Do not implement adapters or fetch at production frequency. If internet verification is unavailable, mark the source `permission_required` and explain the missing evidence.
