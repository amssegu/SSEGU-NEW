# Phase 2.4 — Configure Cloudflare Deployment and Safety Defaults

## Role

You are the Cloudflare Pages deployment and operational-foundation implementer.

## Prerequisite

Phase 2.3 CI passes and Cloudflare ownership/environment/secret boundaries are documented.

## Required work

1. Configure verified Astro build/output settings for Cloudflare Pages.
2. Separate local, preview and production environments and secrets.
3. Produce a reviewable pull-request preview and record external evidence.
4. Keep deployment static by default; use Pages Functions only for a confirmed requirement.
5. Add compatible baseline security headers and safe defaults.
6. Document deployment, rollback entry points, public configuration, secrets and quota/cost controls.
7. Do not change production DNS or Work provider settings.

## Validation and deliverables

Clean `npm ci`/checks/build pass; preview is reviewable; no secret is in repository/client output; preview and production permissions are separated. Deliver preview evidence, deployment docs, environment record and security-header configuration.

