import type { AdapterResult, RawJobRecord, SourceConfig } from '../types.ts';
import { normalizeSourceJob } from '../normalise.ts';

// The catalogue is not a feed. This remains disabled until a selected feed URL
// and redistribution approval are recorded in the source register.
export const YUBHUB_SOURCE: SourceConfig = {
  id: 'yubhub-jobs',
  slug: 'yubhub-jobs',
  name: 'YubHub selected job feed',
  sourceType: 'job_feed',
  endpointUrl: 'https://yubhub.co/free-job-feeds/',
  termsUrl: 'https://yubhub.co/free-job-feeds/',
  permissionClass: 'permission_required',
  attributionText: 'Jobs via YubHub. View the original listing before applying.',
  enabled: false,
  restrictions: { manualReviewRequired: true },
  allowedHostnames: ['yubhub.co'],
  minimumIntervalMs: 12 * 60 * 60 * 1_000,
};

export function parseYubHubPayload(payload: unknown): AdapterResult {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray((payload as { jobs?: unknown }).jobs)
  )
    return {
      outcome: 'malformed',
      records: [],
      error: 'selected YubHub feed endpoint is not approved',
    };
  const records: RawJobRecord[] = [];
  for (const item of (payload as { jobs: unknown[] }).jobs) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (typeof row.id !== 'string' && typeof row.id !== 'number') continue;
    if (
      typeof row.url !== 'string' ||
      typeof row.title !== 'string' ||
      typeof row.company !== 'string'
    )
      continue;
    records.push({
      sourceRecordId: row.id,
      canonicalUrl: row.url,
      applicationUrl: row.url,
      title: row.title,
      employer: row.company,
      location: typeof row.location === 'string' ? row.location : 'Not specified',
      category: typeof row.category === 'string' ? row.category : 'Uncategorised',
      publishedAt: typeof row.publishedAt === 'string' ? row.publishedAt : null,
      deadlineAt: typeof row.deadline === 'string' ? row.deadline : null,
    });
  }
  return records.length ? { outcome: 'success', records } : { outcome: 'empty', records: [] };
}

export const YUBHUB_ADAPTER = { parse: parseYubHubPayload, normalize: normalizeSourceJob };
