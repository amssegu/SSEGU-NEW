import type { NormalizedJob, QuarantineRecord, SourceConfig } from './types.ts';

export function validateJob(job: NormalizedJob, source: SourceConfig): string[] {
  const errors: string[] = [];
  if (!job.sourceId || job.sourceId !== source.id) errors.push('source identity mismatch');
  if (!job.sourceRecordId) errors.push('missing source record ID');
  if (!job.canonicalUrl.startsWith('https://')) errors.push('canonical URL must be HTTPS');
  if (!job.title || !job.employer || !job.location) errors.push('missing required display field');
  if (source.restrictions.mustUseSourceApplicationLink && !job.applicationUrl) errors.push('source application link required');
  if (source.permissionClass === 'permission_required') errors.push('source permission is not approved');
  return errors;
}

export function quarantineInvalidJobs(jobs: NormalizedJob[], source: SourceConfig) {
  const accepted: NormalizedJob[] = [];
  const quarantined: QuarantineRecord[] = [];
  for (const job of jobs) {
    const errors = validateJob(job, source);
    if (errors.length) {
      quarantined.push({ sourceId: source.id, sourceRecordId: job.sourceRecordId, reason: errors.join('; '), record: job });
    } else accepted.push(job);
  }
  return { accepted, quarantined };
}
