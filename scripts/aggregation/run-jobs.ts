import { fetchBounded } from './http.ts';
import { deduplicateJobs, reserveUniqueJobSlugs } from './deduplicate.ts';
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
  slugRegistry,
}: {
  source: SourceConfig;
  db?: D1DatabaseLike;
  now?: Date;
  lastRunAt?: string;
  fetchImpl?: typeof fetch;
  adapter?: JobAdapter;
  slugRegistry?: Set<string>;
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
  const records = [];
  let nextUrl = source.endpointUrl;
  let pageCount = 0;
  let fetchedCount = 0;
  while (pageCount < (source.pagination?.maxPages ?? 1)) {
    const response = await fetchBounded(nextUrl, {
      fetchImpl,
      maxBytes: source.maxResponseBytes,
    });
    if (response.kind === 'failed')
      return finish({
        sourceId: source.id,
        outcome: 'failed',
        fetchedCount,
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
    fetchedCount += parsed.records.length;
    pageCount += 1;
    if (parsed.outcome === 'malformed')
      return finish({
        sourceId: source.id,
        outcome: 'failed',
        fetchedCount,
        acceptedCount: 0,
        rejectedCount: parsed.records.length,
        quarantined: [],
        errorSummary: parsed.error,
      });
    records.push(...parsed.records);
    if (parsed.outcome === 'empty' || !source.pagination?.parameter) break;
    const url = new URL(nextUrl);
    if (source.pagination.kind === 'page') {
      if (parsed.records.length === 0 || parsed.records.length < 20) break;
      const nextPage = Number(url.searchParams.get(source.pagination.parameter) ?? 1) + 1;
      url.searchParams.set(source.pagination.parameter, String(nextPage));
    } else {
      if (!parsed.nextCursor) break;
      url.searchParams.set(source.pagination.parameter, parsed.nextCursor);
    }
    nextUrl = url.toString();
  }
  if (records.length === 0)
    return finish({
      sourceId: source.id,
      outcome: 'empty',
      fetchedCount,
      acceptedCount: 0,
      rejectedCount: 0,
      quarantined: [],
    });
  const normalized = [];
  const quarantined = [];
  for (const raw of records) {
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
  reserveUniqueJobSlugs(deduped.unique, slugRegistry);
  const summary: RunSummary = {
    sourceId: source.id,
    outcome:
      deduped.unique.length === 0
        ? 'failed'
        : checked.quarantined.length + deduped.duplicates.length + quarantined.length > 0
          ? 'partial'
          : 'success',
    fetchedCount,
    acceptedCount: deduped.unique.length,
    rejectedCount: checked.quarantined.length + deduped.duplicates.length + quarantined.length,
    quarantined: [...quarantined, ...checked.quarantined],
  };
  if (db) {
    const runId = `${source.id}:${now.toISOString()}`;
    for (const job of deduped.unique) {
      await upsertJob(db, job, now.toISOString()).run();
    }
    await recordIngestionRun(
      db,
      summary,
      now.toISOString(),
      new Date(now.valueOf() + 1).toISOString(),
    );
    for (const job of deduped.unique) {
      await recordStatusHistory(db, job, runId, 'successful observation').run();
    }
  }
  return summary;
}
