#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd "$(dirname "$0")" && pwd)
repo_root=$(cd "$script_dir/.." && pwd)
tmp_dir=$(mktemp -d "${TMPDIR:-/tmp}/ssegu-phase-01.XXXXXX")
trap 'rm -rf "$tmp_dir"' EXIT
database="$tmp_dir/phase-01.sqlite"

sqlite3 -batch -bail -cmd 'PRAGMA foreign_keys = ON;' "$database" \
  < "$repo_root/migrations/d1/0001_create_job_submissions.sql"
sqlite3 -batch -bail -cmd 'PRAGMA foreign_keys = ON;' "$database" \
  < "$repo_root/migrations/d1/0002_create_work_aggregation.sql"
sqlite3 -batch -bail -cmd 'PRAGMA foreign_keys = ON;' "$database" \
  < "$repo_root/migrations/d1/0001_create_job_submissions.sql"
sqlite3 -batch -bail -cmd 'PRAGMA foreign_keys = ON;' "$database" \
  < "$repo_root/migrations/d1/0002_create_work_aggregation.sql"

tables=$(sqlite3 -batch "$database" "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;")
for table in job_submissions content_sources jobs courses ingestion_runs listing_status_history; do
  grep -qx "$table" <<<"$tables"
done

sqlite3 -batch -bail -cmd 'PRAGMA foreign_keys = ON;' "$database" <<'SQL'
INSERT INTO content_sources (
  id, slug, name, source_type, endpoint_url, terms_url, permission_class,
  enabled, restriction_flags_json, created_at, updated_at
) VALUES (
  'source-1', 'source-1', 'Fixture Source', 'job_feed',
  'https://example.com/jobs', 'https://example.com/terms', 'metadata_only',
  0, '{"prohibitJobpostingSchema":true}', '2026-11-15T00:00:00Z', '2026-11-15T00:00:00Z'
);
INSERT INTO jobs (
  id, source_id, source_record_id, canonical_url, slug, title, employer,
  location, category, employment_type, work_mode, salary_period,
  first_seen_at, last_seen_at, status, permission_type, content_hash,
  created_at, updated_at
) VALUES (
  'job-1', 'source-1', 'record-1', 'https://example.com/job-1', 'job-1',
  'Fixture Job', 'Fixture Employer', 'Kampala', 'Data', 'full_time',
  'hybrid', 'unknown', '2026-11-15T00:00:00Z', '2026-11-15T00:00:00Z',
  'active', 'metadata_only', 'hash-1', '2026-11-15T00:00:00Z', '2026-11-15T00:00:00Z'
);
INSERT INTO courses (
  id, source_id, source_record_id, canonical_url, slug, title, provider,
  delivery_mode, course_price_status, certificate_price_status,
  availability_status, first_seen_at, last_seen_at, permission_type,
  content_hash, created_at, updated_at
) VALUES (
  'course-1', 'source-1', 'course-1', 'https://example.com/course-1',
  'course-1', 'Fixture Course', 'Fixture Provider', 'self_paced',
  'free_to_audit', 'paid', 'available', '2026-11-15T00:00:00Z',
  '2026-11-15T00:00:00Z', 'link_only', 'hash-course-1',
  '2026-11-15T00:00:00Z', '2026-11-15T00:00:00Z'
);
INSERT INTO job_submissions (
  id, organisation, contact_name, contact_email, job_title, location,
  employment_type, description, deadline, application_details, created_at,
  retention_until
) VALUES (
  'submission-1', 'Fixture Org', 'Fixture Contact', 'contact@example.com',
  'Fixture Submission', 'Kampala', 'Full-time', 'Private submission',
  '2026-12-01', 'Email privately', '2026-11-15T00:00:00Z', '2027-11-15'
);
SQL

if sqlite3 -batch -bail "$database" "INSERT INTO jobs (id, source_id, source_record_id, canonical_url, slug, title, employer, location, category, employment_type, work_mode, salary_period, first_seen_at, last_seen_at, status, permission_type, content_hash, created_at, updated_at) VALUES ('job-2', 'source-1', 'record-2', 'https://example.com/job-2', 'job-2', 'Bad', 'Bad', 'Kampala', 'Data', 'invalid', 'hybrid', 'unknown', '2026-11-15T00:00:00Z', '2026-11-15T00:00:00Z', 'active', 'metadata_only', 'hash-2', '2026-11-15T00:00:00Z', '2026-11-15T00:00:00Z');" >/dev/null 2>&1; then
  echo 'invalid employment_type was accepted' >&2
  exit 1
fi

if sqlite3 -batch -bail "$database" "INSERT INTO listing_status_history (id, listing_type, listing_id, status, reason, observed_at) VALUES ('status-1', 'job', 'job-1', 'invalid', 'test', '2026-11-15T00:00:00Z');" >/dev/null 2>&1; then
  echo 'invalid listing status was accepted' >&2
  exit 1
fi

if sqlite3 -batch -bail "$database" "INSERT INTO jobs (id, source_id, source_record_id, canonical_url, slug, title, employer, location, category, employment_type, work_mode, salary_period, first_seen_at, last_seen_at, status, permission_type, content_hash, created_at, updated_at) SELECT 'job-3', source_id, source_record_id, 'https://example.com/job-3', 'job-3', title, employer, location, category, employment_type, work_mode, salary_period, first_seen_at, last_seen_at, 'active', permission_type, 'hash-3', created_at, updated_at FROM jobs WHERE id = 'job-1';" >/dev/null 2>&1; then
  echo 'duplicate source identity was accepted' >&2
  exit 1
fi

indexes=$(sqlite3 -batch "$database" "SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'jobs_%' ORDER BY name;")
grep -qx 'jobs_status_deadline_idx' <<<"$indexes"
grep -qx 'jobs_location_category_mode_idx' <<<"$indexes"
! rg -q 'content_sources|listing_status_history' "$repo_root/functions/api/job-submissions.ts"
! rg -q 'contact_email|supporting_information|rejection_reason' "$repo_root/migrations/d1/0002_create_work_aggregation.sql"

for domain in jobs courses; do
  domain_database="$tmp_dir/$domain.sqlite"
  for migration in "$repo_root/migrations/$domain"/*.sql; do
    sqlite3 -batch -bail -cmd 'PRAGMA foreign_keys = ON;' "$domain_database" < "$migration"
  done
  domain_tables=$(sqlite3 -batch "$domain_database" "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
  grep -qx 'content_sources' <<<"$domain_tables"
  grep -qx 'ingestion_runs' <<<"$domain_tables"
  if [[ "$domain" == jobs ]]; then
    grep -qx 'jobs' <<<"$domain_tables"
    ! grep -qx 'courses' <<<"$domain_tables"
  else
    grep -qx 'courses' <<<"$domain_tables"
    ! grep -qx 'jobs' <<<"$domain_tables"
  fi
done

echo 'work aggregation migration checks passed'
