import type { NormalizedJob } from './types.ts';

export function deduplicateJobs(jobs: NormalizedJob[]) {
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const seenFingerprints = new Set<string>();
  const unique: NormalizedJob[] = [];
  const duplicates: NormalizedJob[] = [];
  for (const job of jobs) {
    const fingerprint = `${job.title.toLowerCase()}|${job.employer.toLowerCase()}|${job.location.toLowerCase()}|${job.deadlineAt ?? ''}`;
    if (seenIds.has(job.id) || seenUrls.has(job.canonicalUrl) || seenFingerprints.has(fingerprint)) {
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
