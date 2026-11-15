import type { AdapterResult, RawJobRecord, SourceConfig } from '../types.ts';
import { normalizeSourceJob } from '../normalise.ts';

export const HIMALAYAS_SOURCE: SourceConfig = {
  id: 'himalayas-jobs',
  slug: 'himalayas-jobs',
  name: 'Himalayas remote jobs API',
  sourceType: 'jobs_api',
  endpointUrl: 'https://himalayas.app/jobs/api?limit=20',
  termsUrl: 'https://himalayas.app/terms',
  permissionClass: 'permission_required',
  attributionText: 'Jobs via Himalayas. Apply through the original Himalayas application link.',
  enabled: false,
  restrictions: {
    mustUseSourceApplicationLink: true,
    prohibitJobpostingSchema: true,
    removeWhenExpired: true,
    manualReviewRequired: true,
  },
  allowedHostnames: ['himalayas.app'],
  minimumIntervalMs: 12 * 60 * 60 * 1_000,
};

export function parseHimalayasPayload(payload: unknown): AdapterResult {
  const items = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { jobs?: unknown }).jobs)
      ? (payload as { jobs: unknown[] }).jobs
      : undefined;
  if (!items) return { outcome: 'malformed', records: [], error: 'expected Himalayas jobs array' };
  const records: RawJobRecord[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const id = row.guid ?? row.id;
    if (
      (typeof id !== 'string' && typeof id !== 'number') ||
      typeof row.title !== 'string' ||
      typeof row.applicationLink !== 'string' ||
      typeof row.url !== 'string'
    )
      continue;
    records.push({
      sourceRecordId: id,
      canonicalUrl: row.url,
      applicationUrl: row.applicationLink,
      title: row.title,
      employer: typeof row.companyName === 'string' ? row.companyName : 'Himalayas employer',
      location: typeof row.location === 'string' ? row.location : 'Remote',
      category: 'Remote work',
      deadlineAt: typeof row.expiryDate === 'string' ? row.expiryDate.slice(0, 10) : null,
      salaryText: typeof row.salary === 'string' ? row.salary : null,
      salaryPeriod:
        typeof row.salaryPeriod === 'string' &&
        ['hour', 'day', 'week', 'month', 'year', 'one_off'].includes(row.salaryPeriod)
          ? (row.salaryPeriod as RawJobRecord['salaryPeriod'])
          : 'unknown',
    });
  }
  return records.length
    ? { outcome: 'success', records }
    : {
        outcome: items.length === 0 ? 'empty' : 'malformed',
        records,
        error: 'no valid Himalayas records',
      };
}

export const HIMALAYAS_ADAPTER = { parse: parseHimalayasPayload, normalize: normalizeSourceJob };
