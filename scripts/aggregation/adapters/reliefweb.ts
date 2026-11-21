import type { AdapterResult, RawJobRecord, SourceConfig } from '../types.ts';
import { normalizeSourceJob } from '../normalise.ts';

const reliefWebSource: SourceConfig = {
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

export function createReliefWebSource(appName?: string): SourceConfig {
  const source = { ...reliefWebSource };
  if (!appName?.trim()) return source;
  const endpoint = new URL(source.endpointUrl);
  endpoint.searchParams.set('appname', appName.trim());
  endpoint.searchParams.set('profile', 'full');
  endpoint.searchParams.set('preset', 'latest');
  source.endpointUrl = endpoint.toString();
  source.appName = appName.trim();
  return source;
}

export const RELIEFWEB_SOURCE = createReliefWebSource();

export function parseReliefWebPayload(payload: unknown): AdapterResult {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray((payload as { data?: unknown }).data)
  )
    return { outcome: 'malformed', records: [], error: 'expected ReliefWeb data array' };
  const records: RawJobRecord[] = [];
  const data = (payload as { data: unknown[] }).data;
  for (const item of data) {
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
    const countries = Array.isArray(row.country) ? row.country : [row.country];
    const countryNames = countries
      .map((country) =>
        typeof country === 'string'
          ? country
          : country && typeof country === 'object' && typeof (country as { name?: unknown }).name === 'string'
            ? (country as { name: string }).name
            : '',
      )
      .filter(Boolean);
    const categories = Array.isArray(row.career_categories) ? row.career_categories : [];
    const categoryNames = categories
      .map((category) =>
        category && typeof category === 'object' && typeof (category as { name?: unknown }).name === 'string'
          ? (category as { name: string }).name
          : '',
      )
      .filter(Boolean);
    const date = row.date && typeof row.date === 'object' ? (row.date as Record<string, unknown>) : {};
    records.push({
      sourceRecordId: id,
      sourceData: item as Record<string, unknown>,
      canonicalUrl: row.url,
      title: row.title,
      employer:
        typeof row.source === 'object' &&
        row.source &&
        typeof (row.source as { name?: unknown }).name === 'string'
          ? (row.source as { name: string }).name
          : 'ReliefWeb publisher',
      location: countryNames.join(', ') || 'International',
      category: categoryNames.slice(0, 2).join(', ') || 'Humanitarian and development',
      permittedExcerpt: typeof row.body === 'string' ? row.body : null,
      deadlineAt: typeof date.closing === 'string' ? date.closing.slice(0, 10) : null,
      publishedAt: typeof date.created === 'string' ? date.created : null,
    });
  }
  return records.length
    ? { outcome: 'success', records }
    : {
        outcome: data.length === 0 ? 'empty' : 'malformed',
        records,
        error: 'no approved ReliefWeb records',
      };
}

export const RELIEFWEB_ADAPTER = { parse: parseReliefWebPayload, normalize: normalizeSourceJob };
