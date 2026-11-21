CREATE TRIGGER IF NOT EXISTS content_sources_courses_only_insert
BEFORE INSERT ON content_sources
WHEN NEW.source_type NOT IN ('course_catalogue', 'course_api')
BEGIN
  SELECT RAISE(ABORT, 'courses database accepts course sources only');
END;

CREATE TRIGGER IF NOT EXISTS content_sources_courses_only_update
BEFORE UPDATE OF source_type ON content_sources
WHEN NEW.source_type NOT IN ('course_catalogue', 'course_api')
BEGIN
  SELECT RAISE(ABORT, 'courses database accepts course sources only');
END;
