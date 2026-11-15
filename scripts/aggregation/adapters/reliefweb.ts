import type { AdapterResult, RawJobRecord, SourceConfig } from '../types.ts';
import { normalizeSourceJob } from '../normalise.ts';

export const RELIEFWEB_SOURCE: SourceConfig = {
  id: 'reliefweb-jobs',
  slug: 'reliefweb-jobs',
  name: 'ReliefWeb jobs API',
  sourceType: 'jobs_api',
  endpointUrl: 'https://api.reliefweb.int/v2/jobs',
  termsUrl: 'https://apidoc.reliefweb.int/',
  permissionClass: 'permission_required',
  attributionText: 'Jobs via ReliefWeb and the original publisher.',
  enabled: false,
  restrictions: { requiresAppname: true, manualReviewRequired: true },
  allowedHostnames: ['reliefweb.int', 'api.reliefweb.int'],
  minimumIntervalMs: 12 * 60 * 60 * 1_000,
};

export function parseReliefWebPayload(payload: unknown): AdapterResult {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray((payload as { data?: unknown }).data)
  )
    return { outcome: 'malformed', records: [], error: 'expected ReliefWeb data array' };
  const records: RawJobRecord[] = [];
  for (const item of (payload as { data: unknown[] }).data) {
    if (!item || typeof item !== 'object') continue;
    const fields = (item as { fields?: unknown }).fields;
    if (!fields || typeof fields !== 'object') continue;
    const row = fields as Record<string, unknown>;
    const id = (item as { id?: unknown }).id;
    if (
      (typeof id !== 'string' && typeof id !== 'number') ||
      typeof row.url !== 'string' ||
      typeof row.title !== 'string'
    )
      continue;
    records.push({
      sourceRecordId: id,
      canonicalUrl: row.url,
      title: row.title,
      employer:
        typeof row.source === 'object' &&
        row.source &&
        typeof (row.source as { name?: unknown }).name === 'string'
          ? (row.source as { name: string }).name
          : 'ReliefWeb publisher',
      location: typeof row.country === 'string' ? row.country : 'International',
      category: 'Humanitarian and development',
      publishedAt:
        typeof row.date === 'object' &&
        row.date &&
        typeof (row.date as { created?: unknown }).created === 'string'
          ? (row.date as { created: string }).created
          : null,
    });
  }
  return records.length
    ? { outcome: 'success', records }
    : {
        outcome: payload.data && (payload.data as unknown[]).length === 0 ? 'empty' : 'malformed',
        records,
        error: 'no approved ReliefWeb records',
      };
}

export const RELIEFWEB_ADAPTER = { parse: parseReliefWebPayload, normalize: normalizeSourceJob };
