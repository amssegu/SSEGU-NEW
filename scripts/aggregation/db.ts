import type { NormalizedJob, RunSummary } from './types.ts';

export interface D1StatementLike {
  bind(...values: unknown[]): D1StatementLike;
  run(): Promise<unknown>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1StatementLike;
}

export function upsertJob(db: D1DatabaseLike, job: NormalizedJob, observedAt: string) {
  return db
    .prepare(
      `
    INSERT INTO jobs (id, source_id, source_record_id, canonical_url, application_url, slug, title, employer, location, country, category, employment_type, work_mode, permitted_excerpt, salary_text, salary_currency, salary_period, published_at, deadline_at, first_seen_at, last_seen_at, status, permission_type, content_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source_id, source_record_id) DO UPDATE SET
      canonical_url = excluded.canonical_url,
      application_url = excluded.application_url,
      title = excluded.title,
      employer = excluded.employer,
      location = excluded.location,
      country = excluded.country,
      category = excluded.category,
      employment_type = excluded.employment_type,
      work_mode = excluded.work_mode,
      permitted_excerpt = excluded.permitted_excerpt,
      salary_text = excluded.salary_text,
      salary_currency = excluded.salary_currency,
      salary_period = excluded.salary_period,
      published_at = excluded.published_at,
      deadline_at = excluded.deadline_at,
      last_seen_at = excluded.last_seen_at,
      status = excluded.status,
      permission_type = excluded.permission_type,
      content_hash = excluded.content_hash,
      updated_at = excluded.updated_at
  `,
    )
    .bind(
      job.id,
      job.sourceId,
      job.sourceRecordId,
      job.canonicalUrl,
      job.applicationUrl ?? null,
      job.slug,
      job.title,
      job.employer,
      job.location,
      job.country ?? null,
      job.category,
      job.employmentType,
      job.workMode,
      job.permittedExcerpt ?? null,
      job.salaryText ?? null,
      job.salaryCurrency ?? null,
      job.salaryPeriod,
      job.publishedAt ?? null,
      job.deadlineAt ?? null,
      job.firstSeenAt,
      observedAt,
      job.status,
      job.permissionType,
      job.contentHash,
      observedAt,
      observedAt,
    );
}

export async function recordIngestionRun(
  db: D1DatabaseLike,
  summary: RunSummary,
  startedAt: string,
  finishedAt: string,
) {
  const trigger = process.env.GITHUB_EVENT_NAME === 'schedule' ? 'scheduled' : 'manual';
  return db
    .prepare(
      `INSERT INTO ingestion_runs (id, source_id, content_type, trigger, started_at, finished_at, result, fetched_count, accepted_count, rejected_count, error_summary) VALUES (?, ?, 'jobs', ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      `${summary.sourceId}:${startedAt}`,
      summary.sourceId,
      trigger,
      startedAt,
      finishedAt,
      summary.outcome === 'skipped' ? 'failed' : summary.outcome,
      summary.fetchedCount,
      summary.acceptedCount,
      summary.rejectedCount,
      summary.errorSummary?.slice(0, 2_000) ?? null,
    )
    .run();
}

export function recordStatusHistory(
  db: D1DatabaseLike,
  job: NormalizedJob,
  runId: string,
  reason: string,
) {
  return db
    .prepare(
      `INSERT INTO listing_status_history (id, listing_type, listing_id, previous_status, status, reason, observed_at, ingestion_run_id) VALUES (?, 'job', ?, NULL, ?, ?, ?, ?)`,
    )
    .bind(`${runId}:${job.id}`, job.id, job.status, reason.slice(0, 500), job.lastSeenAt, runId);
}
