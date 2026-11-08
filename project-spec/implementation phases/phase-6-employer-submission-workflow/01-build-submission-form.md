# Phase 6.1 — Build Employer Submission Form

## Role

You are the Work employer-submission frontend implementer.

## Prerequisite

Phase 5 must PASS. Read `new-tech-spec.md` section 7 and keep the form inside `WorkLayout`.

## Required work

1. Implement `/work/submit-job/` with organisation, contact, job title, description, location, employment type, deadline and application details fields.
2. Add optional salary, website, logo and supporting-information fields without implying they are verified.
3. Add labels, help text, client-friendly errors and a clear privacy/retention notice.
4. Make the form responsive and accessible, but do not publish or persist data from the browser.
5. Add success, validation and failure states that do not expose internal details.

## Validation

Test keyboard operation, required fields, size limits in the UI, mobile layout and no-JavaScript fallback behavior. Do not claim a submission is accepted until the server endpoint exists.

