import type { AdapterResult, RawJobRecord, SourceConfig } from '../types.ts';
import { normalizeSourceJob } from '../normalise.ts';

export const YUBHUB_SOURCE: SourceConfig = {
  id: 'yubhub-jobs',
  slug: 'yubhub-jobs',
  name: 'YubHub selected job feed',
  sourceType: 'job_feed',
  endpointUrl: 'https://feeds.yubhub.co/facet/category/operations.rss',
  termsUrl: 'https://yubhub.co/free-job-feeds/',
  permissionClass: 'redistribute_with_attribution',
  attributionText: 'Data by YubHub. View the original listing before applying.',
  enabled: true,
  restrictions: { manualReviewRequired: true },
  allowedHostnames: [],
  minimumIntervalMs: 12 * 60 * 60 * 1_000,
};

export function parseYubHubPayload(payload: unknown): AdapterResult {
  if (typeof payload === 'string') {
    const records: RawJobRecord[] = [];
    for (const item of payload.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
      const value = (tag: string) =>
        item[1]
          .match(new RegExp(`<${tag}(?:[^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'i'))?.[1]
          ?.replace(/<!\[CDATA\[|\]\]>/g, '')
          .trim();
      const url = value('link');
      const title = value('title');
      if (!url || !title) continue;
      records.push({
        sourceRecordId: value('guid') || url,
        canonicalUrl: url,
        applicationUrl: url,
        title,
        employer: value('company') || 'YubHub listing',
        location: value('location') || 'Not specified',
        category: 'Operations',
        publishedAt: value('pubDate') || null,
      });
    }
    return records.length ? { outcome: 'success', records } : { outcome: 'empty', records: [] };
  }
  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray((payload as { jobs?: unknown }).jobs)
  )
    return {
      outcome: 'malformed',
      records: [],
      error: 'expected YubHub RSS or JSON feed',
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
