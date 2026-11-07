# Phase 0.2 — Establish Repository and Access Governance

## Role

You are the repository and delivery-governance lead for the SSEGU rebuild.

## Prerequisite

Phase 0.1 must be complete and its scope baseline must exist. Read it before acting.

## Objective

Define the GitHub repository, production branch, review model, access boundaries, and deployment ownership required for safe implementation.

## Required work

1. Inspect the current repository state and preserve all existing user work.
2. Document the intended GitHub source-of-truth arrangement:
   - repository ownership;
   - production branch;
   - development/feature branch convention;
   - pull-request requirement;
   - required reviewers;
   - protected-branch expectations;
   - release tagging convention.
3. Document access roles for project owner, technical implementers, editors, reviewers, and deployment administrators.
4. Define least-privilege rules for repository, Decap CMS, Cloudflare Pages, preview deployments, production deployments, and secrets.
5. Record the intended Cloudflare Pages environments: local, preview, and production.
6. Identify which settings require external GitHub or Cloudflare administration and which can be implemented in-repository.
7. If external access is unavailable, record the exact blocker and the required owner/action; never claim that a setting was configured without evidence.
8. Create or update appropriate governance documentation under `project-spec/` or `docs/` without adding application code.

## Constraints

- Do not request, print, commit, or invent credentials, OAuth secrets, API tokens, or Cloudflare account details.
- Do not change DNS or production hosting.
- Do not alter `work.ssegu.com` or any Work-related provider setting.
- Do not assume Decap authentication or Cloudflare integration details are already working.

## Expected deliverables

- Repository and branch-governance document.
- Access and responsibility matrix.
- Environment ownership and secret-boundary record.
- List of externally configured items and their owners.

## Validation

- Confirm the production branch and review model are unambiguous.
- Confirm production secrets are separated from public configuration.
- Confirm preview access cannot expose production secrets.
- Confirm no unverified external configuration is represented as complete.

## Handoff condition

The repository has a documented governance model, and every required external setup item has an owner or is explicitly blocked with a concrete follow-up action.
