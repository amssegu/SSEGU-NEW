# Phase 01 aggregation data contract

**Version:** 1.0  
**Checked:** 15 November 2026  
**Scope:** imported Work jobs and link-only course records only

This contract is separate from Astro editorial collections and from the
employer-submission schema. Imported records are never inserted into
`job_submissions`, and editorial records are never treated as source imports.

## Shared rules

- IDs, source record IDs, slugs, hashes and URLs are stored as UTF-8 `TEXT`.
- Timestamps are UTC ISO-8601 strings with an explicit `Z` suffix. A date-only
  deadline may be stored as `YYYY-MM-DD` when the source supplies no time.
- Slugs are lowercase ASCII URL slugs matching
  `^[a-z0-9]+(?:-[a-z0-9]+)*$`. They are generated from title plus a stable
  source identity; title similarity is never a deduplication key.
- Canonical URLs must be absolute `https:` URLs. Application/enrolment URLs
  must also be absolute `https:` URLs when present.
- A source failure never changes existing listing status. Expiry or withdrawal
  requires reliable source evidence or an explicit deadline policy.
- A record is publishable only when its source is enabled, its permission class
  is not `permission_required`, its status is allowed for the view, its
  required URLs/fields are valid, and it is not suppressed or malformed.
- `active` jobs must have a future/today deadline or a documented source signal
  that the vacancy remains open. Expired/withdrawn/unverified jobs are not
  eligible for active `JobPosting` markup.
- Course access price and certificate price are independent fields. A free
  course does not imply a free certificate.
- Source restriction flags are authoritative policy inputs, including
  `requires_appname`, `requires_api_key`, `must_use_source_application_link`,
  `prohibit_jobposting_schema`, `remove_when_expired`,
  `commercial_reuse_allowed`, and `manual_review_required`.

## `content_sources`

One row per candidate source. `permission_class` is one of
`metadata_only`, `redistribute_with_attribution`, `open_license`, `link_only`,
or `permission_required`. `enabled` is an integer boolean and defaults to 0.
`restriction_flags_json` contains the named boolean flags above and is
validated as JSON at the application boundary. `reviewed_at` and
`permission_expires_at` are UTC timestamps.

## `jobs`

Required identity: `source_id` + `source_record_id`, with unique canonical URL
and unique generated slug. Required display fields are title, employer,
location, category, employment type, work mode, source URL and content hash.
`application_url` is optional but, when supplied, must comply with the source
flag requiring the original application link. `permitted_excerpt` is the only
description-like field and must contain only source-permitted text.

Enums:

- `employment_type`: `full_time`, `part_time`, `contract`, `temporary`,
  `internship`, `volunteer`
- `work_mode`: `on_site`, `hybrid`, `remote`, `unknown`
- `salary_period`: `hour`, `day`, `week`, `month`, `year`, `one_off`, `unknown`
- `status`: `active`, `expired`, `withdrawn`, `unverified`, `suppressed`

`permission_type` repeats the effective source permission classification on the
record for export/policy checks. `first_seen_at` is immutable; `last_seen_at`
updates only after a successful observation.

## `courses`

Required identity: `source_id` + `source_record_id`, with unique canonical URL
and unique generated slug. `original_url` is the provider course page and
`enrolment_url` is the direct access destination when different.

Enums:

- `delivery_mode`: `online`, `in_person`, `hybrid`, `self_paced`, `unknown`
- `course_price_status`: `free`, `paid`, `free_to_audit`, `unknown`,
  `not_stated`
- `certificate_price_status`: `free`, `paid`, `unavailable`, `unknown`,
  `not_stated`
- `availability_status`: `available`, `unavailable`, `unverified`, `withdrawn`

The summary is factual, concise metadata; no copied lessons, videos, readings,
images or full provider descriptions are allowed by this contract.

## `ingestion_runs`

One row per source/content-type attempt. `result` distinguishes `success`,
`partial`, `empty`, and `failed`; a bounded `error_summary` is operational
diagnostic text and must not contain credentials or response bodies. Counts are
non-negative integers. `trigger` is `scheduled`, `manual`, or `build`.

## `listing_status_history`

Append-only evidence of status transitions. `listing_type` is `job` or
`course`; `listing_id` points to the corresponding table by application-level
validation because SQLite has no portable polymorphic foreign key. A status
history row records the observation time, reason, and optional ingestion run.

## Export boundary

Public exports may include only approved display metadata, attribution and
original/application/enrolment links. They must exclude employer submission
contact data, moderation notes, credentials, raw API responses and private
operational details.
