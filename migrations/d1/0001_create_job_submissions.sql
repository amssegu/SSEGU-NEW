CREATE TABLE IF NOT EXISTS job_submissions (
  id TEXT PRIMARY KEY NOT NULL,
  organisation TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  job_title TEXT NOT NULL,
  location TEXT NOT NULL,
  employment_type TEXT NOT NULL,
  description TEXT NOT NULL,
  deadline TEXT NOT NULL,
  application_details TEXT NOT NULL,
  source_url TEXT,
  salary TEXT,
  logo_url TEXT,
  supporting_information TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'rejected')),
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT,
  rejection_reason TEXT,
  retention_until TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS job_submissions_status_created_idx
  ON job_submissions (status, created_at);

CREATE INDEX IF NOT EXISTS job_submissions_retention_idx
  ON job_submissions (retention_until);
