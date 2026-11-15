import type { SourceConfig } from './types.ts';

export function canFetchSource(source: SourceConfig, lastRunAt?: string, now = new Date()) {
  if (!source.enabled) return { allowed: false, reason: 'source disabled' };
  if (source.permissionClass === 'permission_required') return { allowed: false, reason: 'permission required' };
  if (lastRunAt && now.valueOf() - new Date(lastRunAt).valueOf() < source.minimumIntervalMs) {
    return { allowed: false, reason: 'refresh interval has not elapsed' };
  }
  return { allowed: true };
}

export function canRunJobsToday(previousSuccessfulRuns: string[], now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  return previousSuccessfulRuns.filter((value) => value.startsWith(day)).length < 2;
}

export function canRunCoursesThisWeek(previousSuccessfulRuns: string[], now = new Date()) {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  return previousSuccessfulRuns.filter((value) => new Date(value) >= date).length < 2;
}

export function mayExpireAfterSuccessfulObservation(status: string, deadlineAt?: string, today = new Date()) {
  if (status !== 'active' || !deadlineAt) return false;
  return deadlineAt < today.toISOString().slice(0, 10);
}
