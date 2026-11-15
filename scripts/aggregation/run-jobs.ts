import { fetchBounded } from './http.ts';
import { deduplicateJobs } from './deduplicate.ts';
import { normalizeJubaJob } from './normalise.ts';
import { canFetchSource } from './policy.ts';
import { quarantineInvalidJobs } from './validate.ts';
import { recordIngestionRun, recordStatusHistory, upsertJob, type D1DatabaseLike } from './db.ts';
import type { JobAdapter, RunSummary, SourceConfig } from './types.ts';
import { parseJubaJobsPayload } from './adapters/jubajobs.ts';

export async function runJobs({
  source,
  db,
  now = new Date(),
  lastRunAt,
  fetchImpl = fetch,
  adapter = { parse: parseJubaJobsPayload, normalize: normalizeJubaJob },
}: {
  source: SourceConfig;
  db?: D1DatabaseLike;
  now?: Date;
  lastRunAt?: string;
  fetchImpl?: typeof fetch;
  adapter?: JobAdapter;
}): Promise<RunSummary> {
  const permission = canFetchSource(source, lastRunAt, now);
  const finish = async (summary: RunSummary) => {
    if (db && summary.outcome !== 'skipped') {
      await recordIngestionRun(
        db,
        summary,
        now.toISOString(),
        new Date(now.valueOf() + 1).toISOString(),
      );
    }
    return summary;
  };
  if (!permission.allowed)
    return finish({
      sourceId: source.id,
      outcome: 'skipped',
      fetchedCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      quarantined: [],
      errorSummary: permission.reason,
    });
  const response = await fetchBounded(source.endpointUrl, {
    fetchImpl,
    maxBytes: source.maxResponseBytes,
  });
  if (response.kind === 'failed')
    return finish({
      sourceId: source.id,
      outcome: 'failed',
      fetchedCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      quarantined: [],
      errorSummary: response.reason,
    });
  let payload: unknown;
  try {
    payload = JSON.parse(response.body);
  } catch {
    payload = response.body;
  }
  const parsed = adapter.parse(payload);
  if (parsed.outcome === 'empty')
    return finish({
      sourceId: source.id,
      outcome: 'empty',
      fetchedCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      quarantined: [],
    });
  if (parsed.outcome === 'malformed')
    return finish({
      sourceId: source.id,
      outcome: 'failed',
      fetchedCount: parsed.records.length,
      acceptedCount: 0,
      rejectedCount: parsed.records.length,
      quarantined: [],
      errorSummary: parsed.error,
    });
  const normalized = [];
  const quarantined = [];
  for (const raw of parsed.records) {
    try {
      normalized.push(adapter.normalize(raw, source, now.toISOString()));
    } catch (error) {
      quarantined.push({
        sourceId: source.id,
        sourceRecordId: String(raw.sourceRecordId),
        reason: error instanceof Error ? error.message : 'normalization failed',
        record: raw,
      });
    }
  }
  const checked = quarantineInvalidJobs(normalized, source);
  const deduped = deduplicateJobs(checked.accepted);
  const summary: RunSummary = {
    sourceId: source.id,
    outcome: deduped.unique.length ? 'success' : 'failed',
    fetchedCount: parsed.records.length,
    acceptedCount: deduped.unique.length,
    rejectedCount: checked.quarantined.length + deduped.duplicates.length + quarantined.length,
    quarantined: [...quarantined, ...checked.quarantined],
  };
  if (db) {
    const runId = `${source.id}:${now.toISOString()}`;
    await recordIngestionRun(
      db,
      summary,
      now.toISOString(),
      new Date(now.valueOf() + 1).toISOString(),
    );
    for (const job of deduped.unique) {
      await upsertJob(db, job, now.toISOString()).run();
      await recordStatusHistory(db, job, runId, 'successful observation').run();
    }
  }
  return summary;
}
