# Phase 0.4 — Phase 0 Readiness Gate

## Role

You are the release-governance reviewer responsible for deciding whether SSEGU may proceed to Phase 1.

## Prerequisites

The following must exist and be reviewed:

- Phase 0.1 scope baseline.
- Phase 0.2 repository/access governance record.
- Phase 0.3 delivery backlog, risk register, decision register, and evidence standard.
- `project-spec/techspec.md`.
- `project-spec/implementation phases/implementation-plan.md`.

## Objective

Perform the final Phase 0 gate. Produce a written PASS or BLOCK decision based on evidence, not intent.

## Required review

1. Verify that the release boundary is limited to the main SSEGU website.
2. Verify that the compromised live `ssegu.com` domain is not being used as a benchmark, data source, or migration input.
3. Verify that `work.ssegu.com` is explicitly excluded from implementation, migration, DNS, redirects, content, design, and hosting changes.
4. Verify that `project-spec/frontend.png` is recorded as the approved frontend source of truth.
5. Verify that the GitHub, branch, review, access, environment, and secret boundaries are documented.
6. Verify that later phases have owners, prerequisites, deliverables, evidence, and exit gates.
7. Verify that high-impact risks and unresolved decisions are owned and have safe next actions.
8. Verify that the project knows which tasks are waiting for the supplied migration data.
9. Check for contradictions between the scope baseline, governance documents, consolidated implementation plan, and `techspec.md`.
10. Record every failed check as a blocker with the exact remediation required.

## PASS criteria

Issue **PHASE 0: PASS — PROCEED TO PHASE 1** only if:

- all required Phase 0 artefacts exist;
- scope and exclusions are consistent across documents;
- no Work or compromised-domain dependency is active;
- repository/access governance is actionable;
- all high-impact risks have owners and mitigations;
- unresolved decisions have owners and deadlines;
- no blocker prevents Phase 1 discovery and supplied-data intake.

## BLOCK criteria

Issue **PHASE 0: BLOCK — DO NOT PROCEED TO PHASE 1** if any of the following is true:

- scope is ambiguous or contradicts the technical specification;
- Work scope has leaked into the release;
- the compromised live domain is being treated as authoritative;
- migration work is planned without supplied migration data;
- ownership, access, branch protection, or secret boundaries are unknown;
- a high-impact risk has no mitigation or owner;
- a decision that materially affects Phase 1 has no decision owner;
- required evidence is missing or cannot be independently checked.

## Required deliverable

Create a dated Phase 0 gate record containing:

- decision: PASS or BLOCK;
- reviewer;
- date;
- artefacts reviewed;
- checklist result for each criterion;
- blockers and remediation owners;
- explicit next action.

If the result is BLOCK, stop after documenting the remediation path. If the result is PASS, state that Phase 1 — Discovery, supplied-data intake and information architecture — is authorized to begin, subject to its own phase gate.

## Final constraint

Do not mark Phase 0 complete merely because the documents exist. Phase 0 is complete only when the gate record contains an evidence-backed PASS decision.
