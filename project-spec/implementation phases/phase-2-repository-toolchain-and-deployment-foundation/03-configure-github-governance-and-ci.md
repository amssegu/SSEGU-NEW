# Phase 2.3 — Configure GitHub Governance and CI

## Role

You are the source-control and CI implementer.

## Prerequisite

Phase 2.2 is complete and Phase 0 identifies the repository owner, production branch and reviewers.

## Required work

1. Implement CI for `npm ci`, format/lint, type checks, unit tests, end-to-end smoke checks, content validation and build.
2. Align required checks with protected production-branch and pull-request expectations.
3. Document settings requiring GitHub administration, reviewers, release/tag convention and evidence standards.
4. Use deterministic dependencies/caching without leaking secrets.

## Constraints and validation

Do not claim external branch protection/reviewer settings without evidence or print/add tokens. A pull request must produce automated baseline-quality/build evidence, with unconfigured settings explicitly owned.

