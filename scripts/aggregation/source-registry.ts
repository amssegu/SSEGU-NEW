import { HIMALAYAS_SOURCE, HIMALAYAS_ADAPTER } from './adapters/himalayas.ts';
import { JUBAJOBS_SOURCE, parseJubaJobsPayload } from './adapters/jubajobs.ts';
import { RELIEFWEB_SOURCE, RELIEFWEB_ADAPTER } from './adapters/reliefweb.ts';
import { REMOTE_OK_SOURCE, REMOTE_OK_ADAPTER } from './adapters/remoteok.ts';
import { YUBHUB_SOURCE, YUBHUB_ADAPTER } from './adapters/yubhub.ts';
import { normalizeJubaJob } from './normalise.ts';

export const JOB_SOURCE_REGISTRY = [
  {
    source: JUBAJOBS_SOURCE,
    adapter: { parse: parseJubaJobsPayload, normalize: normalizeJubaJob },
  },
  { source: YUBHUB_SOURCE, adapter: YUBHUB_ADAPTER },
  { source: REMOTE_OK_SOURCE, adapter: REMOTE_OK_ADAPTER },
  { source: RELIEFWEB_SOURCE, adapter: RELIEFWEB_ADAPTER },
  { source: HIMALAYAS_SOURCE, adapter: HIMALAYAS_ADAPTER },
] as const;

export const APPROVED_JOB_SOURCE_IDS = new Set([
  'jubajobs-jobs',
  'yubhub-jobs',
  'remoteok-jobs',
  'himalayas-jobs',
]);

export function getApprovedJobSources() {
  return JOB_SOURCE_REGISTRY.filter(({ source }) => APPROVED_JOB_SOURCE_IDS.has(source.id));
}
