import type { AdapterResult, RawJobRecord, SourceConfig } from '../types.ts';

export const JUBAJOBS_SOURCE: SourceConfig = {
  id: 'jubajobs-jobs',
  slug: 'jubajobs-jobs',
  name: 'JubaJobs jobs feed',
  sourceType: 'job_feed',
  endpointUrl: 'https://jubajobs.com/feed/jobs?format=json',
  termsUrl: 'https://jubajobs.com/partners',
  permissionClass: 'redistribute_with_attribution',
  attributionText: 'Listings gathered by JubaJobs. Link back to the listing when you reuse it.',
  enabled: false,
  restrictions: { removeWhenExpired: true, manualReviewRequired: true },
  allowedHostnames: ['jubajobs.com'],
  minimumIntervalMs: 12 * 60 * 60 * 1_000,
};

export function parseJubaJobsPayload(payload: unknown): AdapterResult {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray((payload as { items?: unknown }).items)
  ) {
    return { outcome: 'malformed', records: [], error: 'expected JSON object with items array' };
  }
  const items = (payload as { items: unknown[] }).items;
  if (items.length === 0) return { outcome: 'empty', records: [] };
  const records: RawJobRecord[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (typeof row.id !== 'number' && typeof row.id !== 'string') continue;
    if (
      typeof row.url !== 'string' ||
      typeof row.title !== 'string' ||
      typeof row.organization !== 'string' ||
      typeof row.location !== 'string'
    )
      continue;
    records.push({
      sourceRecordId: row.id,
      canonicalUrl: row.url,
      title: row.title,
      employer: row.organization,
      location: row.location,
      category: typeof row.category === 'string' ? row.category : null,
      deadlineAt: typeof row.deadline === 'string' ? row.deadline : null,
      publishedAt: typeof row.posted_at === 'string' ? row.posted_at : null,
      permittedExcerpt: typeof row.summary === 'string' ? row.summary : null,
    });
  }
  return records.length === items.length
    ? { outcome: 'success', records }
    : {
        outcome: 'malformed',
        records,
        error: 'one or more items failed the required JubaJobs shape',
      };
}
