import { createHash } from 'node:crypto';

const privateFieldPattern =
  /(contact_email|contact_name|supporting_information|rejection_reason|turnstile|api_token|secret|password)/i;

export function isSafeHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, sortKeys(item)]),
  );
}

function hasPrivateFields(value, path = '') {
  if (Array.isArray(value))
    return value.some((item, index) => hasPrivateFields(item, `${path}[${index}]`));
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(
    ([key, item]) => privateFieldPattern.test(key) || hasPrivateFields(item, `${path}.${key}`),
  );
}

export function filterPublishableRecords({ jobs = [], courses = [] }) {
  const safeJobs = jobs.filter(
    (job) =>
      job?.sourceEnabled === true &&
      ['active', 'expired'].includes(job.status) &&
      job.permissionType !== 'permission_required' &&
      typeof job.slug === 'string' &&
      isSafeHttpsUrl(job.canonicalUrl) &&
      !hasPrivateFields(job),
  );
  const safeCourses = courses.filter(
    (course) =>
      course?.sourceEnabled === true &&
      ['available', 'unavailable', 'unverified'].includes(course.availabilityStatus) &&
      course.permissionType !== 'permission_required' &&
      typeof course.slug === 'string' &&
      isSafeHttpsUrl(course.canonicalUrl) &&
      !hasPrivateFields(course),
  );
  return { jobs: safeJobs, courses: safeCourses };
}

function assertUniqueSlugs(records, type) {
  const slugs = records.map((record) => record.slug);
  if (new Set(slugs).size !== slugs.length) throw new Error(`duplicate ${type} slug in export`);
}

export function buildWorkExport(input, { generatedAt = null } = {}) {
  const filtered = filterPublishableRecords(input);
  const jobs = [...filtered.jobs].sort((a, b) => a.slug.localeCompare(b.slug));
  const courses = [...filtered.courses].sort((a, b) => a.slug.localeCompare(b.slug));
  assertUniqueSlugs(jobs, 'job');
  assertUniqueSlugs(courses, 'course');
  const payload = { version: 1, jobs: sortKeys(jobs), courses: sortKeys(courses) };
  const datasetHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  return {
    files: {
      jobs: payload.jobs,
      courses: payload.courses,
      manifest: {
        version: 1,
        generatedAt,
        datasetHash,
        counts: { jobs: jobs.length, courses: courses.length },
        mode: input.mode ?? 'unknown',
      },
    },
    datasetHash,
  };
}
