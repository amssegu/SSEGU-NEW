import type { NormalizedJob } from './types.ts';
import { slugify } from './normalise.ts';

export function deduplicateJobs(jobs: NormalizedJob[]) {
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const seenFingerprints = new Set<string>();
  const unique: NormalizedJob[] = [];
  const duplicates: NormalizedJob[] = [];
  for (const job of jobs) {
    const fingerprint = `${job.title.toLowerCase()}|${job.employer.toLowerCase()}|${job.location.toLowerCase()}|${job.deadlineAt ?? ''}`;
    if (
      seenIds.has(job.id) ||
      seenUrls.has(job.canonicalUrl) ||
      seenFingerprints.has(fingerprint)
    ) {
      duplicates.push(job);
      continue;
    }
    seenIds.add(job.id);
    seenUrls.add(job.canonicalUrl);
    seenFingerprints.add(fingerprint);
    unique.push(job);
  }
  return { unique, duplicates };
}

/**
 * D1 keeps job slugs globally unique, while source feeds only guarantee
 * uniqueness within their own catalogue. Reserve slugs across the complete
 * aggregation run and add a stable source/record suffix only on collision.
 */
export function reserveUniqueJobSlugs(jobs: NormalizedJob[], reserved = new Set<string>()) {
  for (const job of jobs) {
    const original = job.slug;
    let candidate = original;
    let attempt = 0;
    while (reserved.has(candidate)) {
      attempt += 1;
      const stableSuffix = slugify(job.sourceId, job.sourceRecordId).slice(0, 20);
      const attemptSuffix = String(attempt);
      const suffix = `${stableSuffix}-${attemptSuffix}`;
      candidate = `${slugify(original).slice(0, 99 - suffix.length)}-${suffix}`;
    }
    job.slug = candidate;
    reserved.add(candidate);
  }
  return reserved;
}
