# Phase 2.5 — Phase 2 Readiness Gate

## Role

You are the foundation and deployment gate reviewer.

## Prerequisites

Review Phase 1 PASS, Phase 2.1–2.4 artefacts, CI output, preview deployment record, `techspec.md` and the consolidated plan.

## PASS criteria

Issue **PHASE 2: PASS — PROCEED TO PHASE 3** only if clean checkout install/checks/tests/build succeed; required structure and layout foundations exist; CI and external governance are evidenced or owned; Cloudflare preview works; secrets are separated and absent from client output; future-template/static-first decisions are documented; no prohibited feature or Work scope exists.

## BLOCK criteria

Issue **PHASE 2: BLOCK — DO NOT PROCEED TO PHASE 3** for failed build/checks, unverifiable deployment control, secret exposure, missing structure, or scope leak.

## Required deliverable

Create a dated evidence-backed gate record with reviewer, checklist, blockers/remediation owners and next action. Only PASS authorizes Phase 3.

