export type SourcePermission =
  | 'metadata_only'
  | 'redistribute_with_attribution'
  | 'open_license'
  | 'link_only'
  | 'permission_required';

export type JobStatus = 'active' | 'expired' | 'withdrawn' | 'unverified' | 'suppressed';
export type IngestionOutcome = 'success' | 'partial' | 'empty' | 'failed' | 'skipped';

export interface SourceRestrictions {
  requiresAppname?: boolean;
  requiresApiKey?: boolean;
  mustUseSourceApplicationLink?: boolean;
  prohibitJobpostingSchema?: boolean;
  removeWhenExpired?: boolean;
  commercialReuseAllowed?: boolean;
  manualReviewRequired?: boolean;
}

export interface SourceConfig {
  id: string;
  slug: string;
  name: string;
  sourceType: 'job_feed' | 'jobs_api' | 'course_catalogue' | 'course_api';
  endpointUrl: string;
  termsUrl: string;
  permissionClass: SourcePermission;
  attributionText?: string;
  enabled: boolean;
  restrictions: SourceRestrictions;
  allowedHostnames: string[];
  minimumIntervalMs: number;
  maxResponseBytes?: number;
  appName?: string;
}

export interface RawJobRecord {
  sourceRecordId: string | number;
  canonicalUrl: string;
  applicationUrl?: string | null;
  title: string;
  employer: string;
  location: string;
  country?: string | null;
  category?: string | null;
  permittedExcerpt?: string | null;
  publishedAt?: string | null;
  deadlineAt?: string | null;
  salaryText?: string | null;
  salaryCurrency?: string | null;
  salaryPeriod?: NormalizedJob['salaryPeriod'];
}

export interface NormalizedJob {
  id: string;
  sourceId: string;
  sourceRecordId: string;
  canonicalUrl: string;
  applicationUrl?: string;
  slug: string;
  title: string;
  employer: string;
  location: string;
  country?: string;
  category: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'temporary' | 'internship' | 'volunteer';
  workMode: 'on_site' | 'hybrid' | 'remote' | 'unknown';
  permittedExcerpt?: string;
  salaryText?: string;
  salaryCurrency?: string;
  salaryPeriod: 'hour' | 'day' | 'week' | 'month' | 'year' | 'one_off' | 'unknown';
  publishedAt?: string;
  deadlineAt?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  status: JobStatus;
  permissionType: SourcePermission;
  contentHash: string;
  prohibitJobpostingSchema?: boolean;
}

export interface AdapterResult {
  outcome: 'success' | 'empty' | 'malformed';
  records: RawJobRecord[];
  error?: string;
}

export interface QuarantineRecord {
  sourceId: string;
  sourceRecordId?: string;
  reason: string;
  record: unknown;
}

export interface RunSummary {
  sourceId: string;
  outcome: IngestionOutcome;
  fetchedCount: number;
  acceptedCount: number;
  rejectedCount: number;
  quarantined: QuarantineRecord[];
  errorSummary?: string;
}

export interface JobAdapter {
  parse(payload: unknown): AdapterResult;
  normalize(raw: RawJobRecord, source: SourceConfig, now: string): NormalizedJob;
}
