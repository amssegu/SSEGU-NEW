import { canRunCoursesThisWeek } from './policy.ts';

export function courseRunPolicy(previousSuccessfulRuns: string[], now = new Date()) {
  return canRunCoursesThisWeek(previousSuccessfulRuns, now)
    ? { allowed: true as const }
    : { allowed: false as const, reason: 'course refresh limit reached for this UTC week' };
}
