import type { NormalizedJob, RawJobRecord, SourceConfig } from './types.ts';

export function cleanText(value: unknown, maxLength = 2_000): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned ? cleaned.slice(0, maxLength) : undefined;
}

export function canonicalHttpsUrl(value: unknown, allowedHostnames?: string[]): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:') return undefined;
    if (allowedHostnames?.length && !allowedHostnames.includes(url.hostname.toLowerCase()))
      return undefined;
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return undefined;
  }
}

export function isoTimestamp(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? undefined : date.toISOString();
}

export function isoDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) ? undefined : value;
}

export function slugify(...values: string[]) {
  const slug = values
    .join(' ')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
  return slug || 'listing';
}

function sourceDataJson(value: unknown) {
  const json = JSON.stringify(value ?? {});
  return json.length <= 10_000
    ? json
    : JSON.stringify({ truncated: true, originalLength: json.length, preview: json.slice(0, 9_000) });
}

export function normalizeJubaJob(
  raw: RawJobRecord,
  source: SourceConfig,
  now: string,
): NormalizedJob {
  const canonicalUrl = canonicalHttpsUrl(raw.canonicalUrl, source.allowedHostnames);
  if (!canonicalUrl) throw new Error('canonical URL must be HTTPS');
  const sourceRecordId = String(raw.sourceRecordId).trim();
  if (!sourceRecordId) throw new Error('source record ID is required');
  const title = cleanText(raw.title, 240);
  const employer = cleanText(raw.employer, 240);
  const location = cleanText(raw.location, 240);
  if (!title || !employer || !location)
    throw new Error('title, employer and location are required');
  const publishedAt = isoTimestamp(raw.publishedAt);
  const deadlineAt = raw.deadlineAt ? isoDate(raw.deadlineAt) : undefined;
  const contentHash = `source:${source.id}:${sourceRecordId}:${canonicalUrl}:${title}:${employer}:${location}:${deadlineAt ?? ''}`;
  return {
    id: `${source.id}:${sourceRecordId}`,
    sourceId: source.id,
    sourceRecordId,
    canonicalUrl,
    applicationUrl: canonicalHttpsUrl(raw.applicationUrl),
    slug: slugify(title, sourceRecordId),
    title,
    employer,
    location,
    country: cleanText(raw.country, 2),
    category: cleanText(raw.category, 120) ?? 'Uncategorised',
    employmentType: 'full_time',
    workMode: /remote/i.test(location) ? 'remote' : 'unknown',
    permittedExcerpt: cleanText(raw.permittedExcerpt, 500),
    salaryPeriod: 'unknown',
    publishedAt,
    deadlineAt,
    firstSeenAt: now,
    lastSeenAt: now,
    status: deadlineAt && deadlineAt < now.slice(0, 10) ? 'expired' : 'active',
    permissionType: source.permissionClass,
    contentHash,
    sourceDataJson: sourceDataJson(raw.sourceData),
    prohibitJobpostingSchema: source.restrictions.prohibitJobpostingSchema,
  };
}

export function normalizeSourceJob(
  raw: RawJobRecord,
  source: SourceConfig,
  now: string,
): NormalizedJob {
  const canonicalUrl = canonicalHttpsUrl(raw.canonicalUrl, source.allowedHostnames);
  if (!canonicalUrl) throw new Error('canonical URL must be HTTPS');
  const sourceRecordId = String(raw.sourceRecordId).trim();
  const title = cleanText(raw.title, 240);
  const employer = cleanText(raw.employer, 240);
  const location = cleanText(raw.location, 240);
  if (!sourceRecordId || !title || !employer || !location)
    throw new Error('source record ID, title, employer and location are required');
  const deadlineAt = raw.deadlineAt ? isoDate(raw.deadlineAt) : undefined;
  const applicationUrl = raw.applicationUrl ? canonicalHttpsUrl(raw.applicationUrl) : undefined;
  const contentHash = `source:${source.id}:${sourceRecordId}:${canonicalUrl}:${title}:${employer}:${location}:${deadlineAt ?? ''}`;
  return {
    id: `${source.id}:${sourceRecordId}`,
    sourceId: source.id,
    sourceRecordId,
    canonicalUrl,
    applicationUrl,
    slug: slugify(title, sourceRecordId),
    title,
    employer,
    location,
    category: cleanText(raw.category, 120) ?? 'Uncategorised',
    employmentType: 'full_time',
    workMode: /remote/i.test(location) ? 'remote' : 'unknown',
    permittedExcerpt: cleanText(raw.permittedExcerpt, 500),
    salaryText: cleanText(raw.salaryText, 240),
    salaryCurrency: cleanText(raw.salaryCurrency, 8),
    salaryPeriod: raw.salaryPeriod ?? 'unknown',
    publishedAt: isoTimestamp(raw.publishedAt),
    deadlineAt,
    firstSeenAt: now,
    lastSeenAt: now,
    status: deadlineAt && deadlineAt < now.slice(0, 10) ? 'expired' : 'active',
    permissionType: source.permissionClass,
    contentHash,
    sourceDataJson: sourceDataJson(raw.sourceData),
    prohibitJobpostingSchema: source.restrictions.prohibitJobpostingSchema,
  };
}
