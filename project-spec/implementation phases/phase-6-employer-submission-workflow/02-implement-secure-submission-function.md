# Phase 6.2 — Implement Secure Submission Function

## Role

You are the Cloudflare Function and server-validation implementer.

## Prerequisite

Phase 6.1 form exists; secrets, bindings and provider limits are approved.

## Required work

1. Implement a narrowly scoped Pages Function endpoint for job submissions.
2. Validate every field server-side with a schema, enforce request-size limits and normalize safe values.
3. Verify Turnstile server-side and apply rate limiting/basic abuse prevention.
4. Store only accepted pending submissions in private D1 if D1 is approved; otherwise implement the approved secure review equivalent.
5. Never render raw submitted content, publish automatically or log unnecessary personal data.
6. Return stable success/error responses and avoid leaking validation, database or secret details.

## Validation

Test valid, malformed, oversized, missing-token, invalid-token, rate-limited and storage-failure requests. Keep secrets out of source, responses and logs.

