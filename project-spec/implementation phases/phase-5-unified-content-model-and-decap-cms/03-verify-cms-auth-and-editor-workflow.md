# Phase 5.3 — Verify CMS Authentication and Editorial Workflow

## Role

You are the Decap authentication and workflow implementer.

## Prerequisite

Phase 5.2 exists and the selected GitHub backend arrangement is documented.

## Required work

1. Verify the current Decap/GitHub OAuth requirements before configuring callbacks.
2. Configure local, preview and production callbacks or record the external setup required; use a Pages Function/Worker only if required.
3. Keep secrets in Cloudflare/local secret stores and out of source, logs and client bundles.
4. Test login, logout, callback errors, permission failures, draft privacy, preview, publication, correction and Git restoration.
5. Test one News article and one Work job through the real workflow.

## Constraints

Do not claim an external OAuth or Cloudflare setting without evidence. If access is unavailable, produce a precise blocker rather than weakening authentication.

