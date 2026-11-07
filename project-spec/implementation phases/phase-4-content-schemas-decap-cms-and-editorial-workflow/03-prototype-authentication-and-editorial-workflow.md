# Phase 4.3 — Prototype Authentication and Editorial Workflow

## Role

You are the CMS authentication and workflow integration implementer.

## Prerequisite

Phase 4.2 exists and the selected GitHub/Decap authentication arrangement is documented.

## Required work

1. Verify current Decap GitHub-backend authentication requirements.
2. Configure/document OAuth application, local/production callbacks and callback/proxy using Workers/Pages Functions only if required.
3. Store client secrets only in the proper environment secret store.
4. Test login, logout, token handling, callback errors, permission failures, draft visibility, preview, publication, edits, corrections and Git restoration.
5. Test exact branch/PR workflow or document approved direct publishing.
6. Document least-privilege editor onboarding/removal.

## Constraints and deliverables

Do not claim external settings without evidence or expose tokens. Deliver auth/workflow evidence or an explicit blocker, callback/secret documentation and an editor-runbook draft.

