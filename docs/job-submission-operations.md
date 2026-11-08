# Employer Job Submission Operations

**Owner:** SSEGU editorial lead
**Scope:** Private employer vacancy submissions received at `/api/job-submissions`
**Review model:** D1 console or approved Wrangler access; no custom dashboard

## Provisioning checklist

Before enabling the form in production, the Cloudflare Pages project owner must:

1. Create a dedicated D1 database for the submission queue and apply
   `migrations/d1/0001_create_job_submissions.sql`.
2. Bind the database as `JOB_SUBMISSIONS_DB` in production.
3. Bind the production KV namespace as `RATE_LIMIT_KV`, configured for
   approximately five requests per client per 60-second window.
4. Create a Turnstile widget restricted to the production hostname, expose its
   public site key as `PUBLIC_TURNSTILE_SITE_KEY`, and store its secret as the
   Cloudflare secret `TURNSTILE_SECRET_KEY`.
5. Set `TURNSTILE_EXPECTED_HOSTNAME` to the exact production hostname.
6. Redeploy and run the security matrix before enabling the form for public use.

The Function fails closed when the database, rate limiter or Turnstile secret is
missing. No secret belongs in this repository, a browser response or an
application log.

## Rate-limit policy

Production uses the `RATE_LIMIT_KV` binding with an approximate limit of five
calls per 60 seconds for each client. The Function hashes the
`CF-Connecting-IP` value before using it in a windowed KV key. The check runs
before payload parsing, server validation, Turnstile verification and D1
insertion, so rejected or invalid attempts consume the allowance. Requests
from clients sharing an IP address share an allowance. KV is eventually
consistent, so concurrent requests can exceed the threshold; a KV failure
returns HTTP 503 rather than allowing an unprotected submission.

## Review workflow

1. An editor with approved D1 access reads only records with `status = 'pending'`.
2. The editor verifies the organisation, source URL, contact channel, vacancy
   details, deadline and application route. Submitted salary and logo details
   are claims for review, not verified facts.
3. For a suitable vacancy, the editor creates an employer record and a **draft**
   Job document in Decap. The editor adds a source URL and verification note,
   checks the application method, and publishes only after manual approval.
4. The editor marks the private record `reviewed` after the Job draft is safely
   created. This does not publish or change the submitted record into public
   content.
5. For an unsuitable, unverifiable or withdrawn vacancy, the editor records a
   short operational reason and marks it `rejected`. Do not copy sensitive
   contact details into the reason.

Email notification is optional. Editors use the pending queue as the source of
truth for review; no email delivery is required for the workflow to function.

## Field and status mapping

| Submission field       | D1 column                | Editorial use                                |
| ---------------------- | ------------------------ | -------------------------------------------- |
| Organisation name      | `organisation`           | Verify and reference in `employers`          |
| Contact person         | `contact_name`           | Private follow-up only                       |
| Contact email          | `contact_email`          | Private follow-up only                       |
| Job title              | `job_title`              | Candidate-facing Job title after review      |
| Description            | `description`            | Rewrite/check before Job publication         |
| Location               | `location`               | Job location after verification              |
| Employment type        | `employment_type`        | Map to the approved CMS enum                 |
| Deadline               | `deadline`               | Confirm before entering the Job document     |
| Application details    | `application_details`    | Verify and map to URL, email or instructions |
| Website                | `source_url`             | Source and organisation verification         |
| Salary                 | `salary`                 | Optional; never publish without verification |
| Logo URL               | `logo_url`               | Optional review reference; not trusted media |
| Supporting information | `supporting_information` | Private review context only                  |

Allowed statuses are `pending`, `reviewed` and `rejected`. `created_at` and
`reviewed_at` are ISO timestamps. `retention_until` is the deletion deadline.

## Retention and deletion

- Pending records are retained for no longer than 90 days from receipt.
- Reviewed records are retained for no longer than 90 days after review.
- Rejected or withdrawn records are deleted within 30 days; the editor sets the
  retention deadline accordingly when rejecting a record.
- Editors run the approved cleanup query at least monthly and record the count
  deleted, not the submitted content.
- D1 exports are encrypted, access-controlled and deleted after the approved
  recovery window. Do not attach exports to tickets or commit them to Git.

Example operational queries must be run only by an approved editor and must not
be copied with live values into logs or tickets:

```sql
SELECT id, organisation, job_title, location, employment_type, deadline, created_at
FROM job_submissions
WHERE status = 'pending'
ORDER BY created_at ASC;

UPDATE job_submissions
SET status = 'reviewed', reviewed_at = '2026-11-08T00:00:00.000Z',
    reviewed_by = 'approved-editor-id', retention_until = '2027-02-06T00:00:00.000Z'
WHERE id = 'submission-id';

DELETE FROM job_submissions
WHERE retention_until <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now');
```

## Recovery

The project owner exports the D1 database before a schema change and stores the
encrypted export in the approved private recovery location. Recovery is tested
against a separate database, then the binding is switched only after row counts,
status values and retention dates are checked. Production recovery evidence is
not yet available in this repository; see the Phase 6 gate.

## Redacted review test record

**Date:** 8 November 2026
**Record reference:** `redacted-test-001`
**Organisation:** `[redacted]`
**Contact:** `[redacted]`
**Expected status:** `pending`
**Expected public result:** no public Job, sitemap entry, search result or
structured-data record
**Review action:** editor verifies source and application details, creates a
manual Decap draft, then marks the private record `reviewed`
**Personal data retained in this record:** none
