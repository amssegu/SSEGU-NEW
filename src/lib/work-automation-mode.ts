/**
 * Phase 00 boundary for future generated Work data.
 *
 * This is intentionally separate from the existing route fixtures. No D1
 * binding or production secret is read here. Fixture mode is available only
 * to local development/build tooling; a production build reports the
 * adapter as disabled until a later phase supplies an approved export.
 */
export type WorkAutomationMode = 'fixture' | 'empty' | 'production-export' | 'disabled';

const requestedMode = import.meta.env.WORK_AUTOMATION_MODE;

export const workAutomationMode: WorkAutomationMode = import.meta.env.PROD
  ? 'disabled'
  : requestedMode === 'fixture' || requestedMode === 'production-export'
    ? requestedMode
    : 'empty';

export const workAutomationSource =
  workAutomationMode === 'fixture'
    ? 'local synthetic fixture'
    : workAutomationMode === 'production-export'
      ? 'approved production export'
      : workAutomationMode === 'empty'
        ? 'empty local dataset'
        : 'disabled in production';

export function isWorkAutomationFixtureMode() {
  return workAutomationMode === 'fixture';
}
