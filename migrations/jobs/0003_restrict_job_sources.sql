CREATE TRIGGER IF NOT EXISTS content_sources_jobs_only_insert
BEFORE INSERT ON content_sources
WHEN NEW.source_type NOT IN ('job_feed', 'jobs_api')
BEGIN
  SELECT RAISE(ABORT, 'jobs database accepts job sources only');
END;

CREATE TRIGGER IF NOT EXISTS content_sources_jobs_only_update
BEFORE UPDATE OF source_type ON content_sources
WHEN NEW.source_type NOT IN ('job_feed', 'jobs_api')
BEGIN
  SELECT RAISE(ABORT, 'jobs database accepts job sources only');
END;
