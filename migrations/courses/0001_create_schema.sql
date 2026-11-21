PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS content_sources (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('course_catalogue', 'course_api')),
  endpoint_url TEXT NOT NULL,
  terms_url TEXT NOT NULL,
  permission_class TEXT NOT NULL CHECK (permission_class IN ('metadata_only', 'redistribute_with_attribution', 'open_license', 'link_only', 'permission_required')),
  attribution_text TEXT,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  restriction_flags_json TEXT NOT NULL DEFAULT '{}',
  reviewed_at TEXT,
  permission_expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (length(restriction_flags_json) <= 4000),
  CHECK (json_valid(restriction_flags_json))
);

CREATE INDEX IF NOT EXISTS content_sources_enabled_type_idx
  ON content_sources (enabled, source_type);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY NOT NULL,
  source_id TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  canonical_url TEXT NOT NULL UNIQUE,
  enrolment_url TEXT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  summary TEXT,
  subject TEXT,
  level TEXT,
  delivery_mode TEXT NOT NULL CHECK (delivery_mode IN ('online', 'in_person', 'hybrid', 'self_paced', 'unknown')),
  language TEXT,
  duration TEXT,
  course_price_status TEXT NOT NULL CHECK (course_price_status IN ('free', 'paid', 'free_to_audit', 'unknown', 'not_stated')),
  certificate_price_status TEXT NOT NULL CHECK (certificate_price_status IN ('free', 'paid', 'unavailable', 'unknown', 'not_stated')),
  availability_status TEXT NOT NULL CHECK (availability_status IN ('available', 'unavailable', 'unverified', 'withdrawn')),
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('metadata_only', 'redistribute_with_attribution', 'open_license', 'link_only', 'permission_required')),
  content_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (source_id) REFERENCES content_sources (id) ON DELETE RESTRICT,
  UNIQUE (source_id, source_record_id)
);

CREATE INDEX IF NOT EXISTS courses_source_status_idx
  ON courses (source_id, availability_status);

CREATE INDEX IF NOT EXISTS courses_provider_subject_idx
  ON courses (provider, subject, level);

CREATE TABLE IF NOT EXISTS ingestion_runs (
  id TEXT PRIMARY KEY NOT NULL,
  source_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('courses')),
  trigger TEXT NOT NULL CHECK (trigger IN ('scheduled', 'manual', 'build')),
  started_at TEXT NOT NULL,
  finished_at TEXT,
  result TEXT NOT NULL CHECK (result IN ('success', 'partial', 'empty', 'failed')),
  fetched_count INTEGER NOT NULL DEFAULT 0 CHECK (fetched_count >= 0),
  accepted_count INTEGER NOT NULL DEFAULT 0 CHECK (accepted_count >= 0),
  rejected_count INTEGER NOT NULL DEFAULT 0 CHECK (rejected_count >= 0),
  error_summary TEXT,
  FOREIGN KEY (source_id) REFERENCES content_sources (id) ON DELETE RESTRICT,
  CHECK (length(error_summary) <= 2000)
);

CREATE INDEX IF NOT EXISTS ingestion_runs_source_started_idx
  ON ingestion_runs (source_id, started_at);

CREATE TABLE IF NOT EXISTS listing_status_history (
  id TEXT PRIMARY KEY NOT NULL,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('course')),
  listing_id TEXT NOT NULL,
  previous_status TEXT,
  status TEXT NOT NULL,
  reason TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  ingestion_run_id TEXT,
  FOREIGN KEY (ingestion_run_id) REFERENCES ingestion_runs (id) ON DELETE SET NULL,
  CHECK (status IN ('active', 'expired', 'withdrawn', 'unverified', 'suppressed', 'available', 'unavailable')),
  CHECK (previous_status IS NULL OR previous_status IN ('active', 'expired', 'withdrawn', 'unverified', 'suppressed', 'available', 'unavailable')),
  CHECK (previous_status IS NULL OR previous_status <> status)
);

CREATE INDEX IF NOT EXISTS listing_status_history_listing_idx
  ON listing_status_history (listing_type, listing_id, observed_at);
