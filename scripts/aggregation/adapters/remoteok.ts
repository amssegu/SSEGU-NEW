import type { AdapterResult, RawJobRecord, SourceConfig } from '../types.ts';
import { normalizeSourceJob } from '../normalise.ts';

export const REMOTE_OK_SOURCE: SourceConfig = {
  id: 'remoteok-jobs',
  slug: 'remoteok-jobs',
  name: 'Remote OK jobs API',
  sourceType: 'jobs_api',
  endpointUrl: 'https://remoteok.com/api',
  termsUrl: 'https://remoteok.com/faq',
  permissionClass: 'redistribute_with_attribution',
  attributionText: 'Jobs via Remote OK. View the original listing before applying.',
  enabled: true,
  restrictions: { manualReviewRequired: true },
  allowedHostnames: ['remoteok.com'],
  minimumIntervalMs: 12 * 60 * 60 * 1_000,
  maxResponseBytes: 4 * 1024 * 1024,
};

export function parseRemoteOkPayload(payload: unknown): AdapterResult {
  if (!Array.isArray(payload))
    return { outcome: 'malformed', records: [], error: 'expected JSON array' };
  const records: RawJobRecord[] = [];
  for (const item of payload) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (typeof row.id !== 'string' && typeof row.id !== 'number') continue;
    const slug = typeof row.slug === 'string' ? row.slug : undefined;
    const url =
      typeof row.url === 'string'
        ? row.url
        : slug
          ? `https://remoteok.com/remote-jobs/${slug}`
          : undefined;
    if (!url || typeof row.position !== 'string' || typeof row.company !== 'string') continue;
    records.push({
      sourceRecordId: row.id,
      canonicalUrl: url,
      applicationUrl: url,
      title: row.position,
      employer: row.company,
      location: typeof row.location === 'string' ? row.location : 'Remote',
      category: Array.isArray(row.tags)
        ? row.tags
            .filter((tag): tag is string => typeof tag === 'string')
            .slice(0, 2)
            .join(', ')
        : 'Remote work',
      permittedExcerpt: typeof row.description === 'string' ? row.description : null,
      salaryText:
        typeof row.salary === 'string'
          ? row.salary
          : typeof row.salary_min === 'number' || typeof row.salary_max === 'number'
            ? `${row.salary_min ?? ''}-${row.salary_max ?? ''}`.trim()
            : null,
      publishedAt: typeof row.date === 'string' ? row.date : null,
    });
  }
  if (records.length === 0 && payload.length === 0) return { outcome: 'empty', records: [] };
  return records.length === payload.length - 1 || records.length === payload.length
    ? { outcome: 'success', records }
    : {
        outcome: 'malformed',
        records,
        error: 'one or more Remote OK records failed the approved shape',
      };
}

export const REMOTE_OK_ADAPTER = { parse: parseRemoteOkPayload, normalize: normalizeSourceJob };
