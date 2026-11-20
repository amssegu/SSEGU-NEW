import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const now = new Date().toISOString();
const outputDirectory = process.env.RUNNER_TEMP || '/tmp';
const sqlPath = join(outputDirectory, 'ssegu-courses-aggregation.sql');
const reportPath = process.env.COURSE_LIVE_REPORT_PATH ?? join(outputDirectory, 'ssegu-courses-live-report.json');
const catalogue = JSON.parse(await readFile('src/data/curated/courses.json', 'utf8'));

if (!Array.isArray(catalogue) || catalogue.length === 0) {
  throw new Error('course catalogue is empty; refusing to reconcile production D1');
}

const sources = [
  {
    id: 'mit-ocw-courses',
    slug: 'mit-ocw-courses',
    name: 'MIT OpenCourseWare',
    type: 'course_catalogue',
    endpoint: 'https://ocw.mit.edu/',
    terms: 'https://www.ocw.mit.edu/pages/privacy-and-terms-of-use/',
    permission: 'link_only',
    attribution:
      'Course details link to MIT OpenCourseWare. MIT does not award credit or certificates for this material.',
    enabled: true,
  },
  {
    id: 'openlearn-courses',
    slug: 'openlearn-courses',
    name: 'OpenLearn',
    type: 'course_catalogue',
    endpoint: 'https://www.open.edu/openlearn/',
    terms: 'https://www.open.edu/openlearn/about-openlearn/frequently-asked-questions-on-openlearn',
    permission: 'link_only',
    attribution:
      'Course details link to OpenLearn. SSEGU is not affiliated with The Open University.',
    enabled: true,
  },
  {
    id: 'freecodecamp-courses',
    slug: 'freecodecamp-courses',
    name: 'freeCodeCamp',
    type: 'course_catalogue',
    endpoint: 'https://www.freecodecamp.org/learn/',
    terms: 'https://opensource.freecodecamp.org/terms-of-service/',
    permission: 'link_only',
    attribution: 'Course details link to freeCodeCamp. SSEGU is not affiliated with the provider.',
    enabled: true,
  },
  {
    id: 'saylor-courses',
    slug: 'saylor-courses',
    name: 'Saylor Academy',
    type: 'course_api',
    endpoint: 'https://learn.saylor.org/webservice/rest/server.php',
    terms: 'https://www.saylor.org/TermsOfUse',
    permission: 'permission_required',
    attribution:
      'Saylor Academy course links require authenticated API access and separate terms review.',
    enabled: false,
  },
];

const sourceById = new Map([
  ['mit-ocw', 'mit-ocw-courses'],
  ['openlearn', 'openlearn-courses'],
  ['freecodecamp', 'freecodecamp-courses'],
]);

function sqlValue(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function statement(sql, values) {
  let index = 0;
  return `${sql
    .replace(/\?/g, () => sqlValue(values[index++]))
    .trim()
    .replace(/;$/, '')};`;
}

const statements = [];
const enabledSourceIds = sources.filter((source) => source.enabled).map((source) => source.id);
for (const source of sources) {
  statements.push(
    statement(
      `INSERT INTO content_sources (id, slug, name, source_type, endpoint_url, terms_url, permission_class, attribution_text, enabled, restriction_flags_json, reviewed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         endpoint_url = excluded.endpoint_url,
         terms_url = excluded.terms_url,
         permission_class = excluded.permission_class,
         attribution_text = excluded.attribution_text,
         enabled = excluded.enabled,
         reviewed_at = excluded.reviewed_at,
         updated_at = excluded.updated_at`,
      [
        source.id,
        source.slug,
        source.name,
        source.type,
        source.endpoint,
        source.terms,
        source.permission,
        source.attribution,
        source.enabled ? 1 : 0,
        JSON.stringify({ manualReviewRequired: true }),
        now,
        now,
        now,
      ],
    ),
  );
}

for (const source of sources) {
  const sourceCount = catalogue.filter(
    (course) => sourceById.get(course.sourceId) === source.id,
  ).length;
  if (source.enabled && sourceCount === 0) {
    throw new Error(`enabled course source has no catalogue records: ${source.id}`);
  }
  statements.push(
    statement(
      `INSERT INTO ingestion_runs (id, source_id, content_type, trigger, started_at, finished_at, result, fetched_count, accepted_count, rejected_count, error_summary)
       VALUES (?, ?, 'courses', ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        `courses:${source.id}:${now}`,
        source.id,
        process.env.GITHUB_EVENT_NAME === 'schedule' ? 'scheduled' : 'manual',
        now,
        now,
        source.enabled ? 'success' : 'empty',
        sourceCount,
        sourceCount,
        source.enabled ? null : 'authentication required',
      ],
    ),
  );
}

for (const course of catalogue) {
  const sourceId = sourceById.get(course.sourceId);
  if (!sourceId) throw new Error(`course source is not registered: ${course.sourceId}`);
  const id = `${sourceId}:${course.slug}`;
  const contentHash = `sha256:${createHash('sha256').update(JSON.stringify(course)).digest('hex')}`;
  statements.push(
    statement(
      `INSERT INTO courses (id, source_id, source_record_id, canonical_url, enrolment_url, slug, title, provider, summary, subject, level, delivery_mode, language, duration, course_price_status, certificate_price_status, availability_status, first_seen_at, last_seen_at, permission_type, content_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(source_id, source_record_id) DO UPDATE SET
         canonical_url = excluded.canonical_url,
         enrolment_url = excluded.enrolment_url,
         slug = excluded.slug,
         title = excluded.title,
         provider = excluded.provider,
         summary = excluded.summary,
         subject = excluded.subject,
         level = excluded.level,
         delivery_mode = excluded.delivery_mode,
         language = excluded.language,
         duration = excluded.duration,
         course_price_status = excluded.course_price_status,
         certificate_price_status = excluded.certificate_price_status,
         availability_status = excluded.availability_status,
         last_seen_at = excluded.last_seen_at,
         permission_type = excluded.permission_type,
         content_hash = excluded.content_hash,
         updated_at = excluded.updated_at`,
      [
        id,
        sourceId,
        course.slug,
        course.canonicalUrl,
        course.enrolmentUrl ?? course.canonicalUrl,
        course.slug,
        course.title,
        course.provider,
        course.summary ?? null,
        course.subject ?? null,
        course.level ?? null,
        course.deliveryMode ?? 'unknown',
        course.language ?? null,
        course.duration ?? null,
        course.coursePriceStatus ?? 'unknown',
        course.certificatePriceStatus ?? 'unknown',
        course.availabilityStatus ?? 'unverified',
        now,
        now,
        course.permissionType,
        contentHash,
        now,
        now,
      ],
    ),
  );
}

// Reconcile only after every catalogue record has been validated and planned.
// If an earlier statement fails, this statement is never reached. Records not
// observed in this complete catalogue become withdrawn, never deleted.
statements.push(
  `UPDATE courses SET availability_status = 'withdrawn', updated_at = ${sqlValue(now)} WHERE source_id IN (${enabledSourceIds.map(sqlValue).join(', ')}) AND availability_status IN ('available', 'unavailable', 'unverified') AND last_seen_at <> ${sqlValue(now)};`,
);

const report = {
  generatedAt: now,
  sourceResults: sources.map((source) => ({
    sourceId: source.id,
    source: source.name,
    enabled: source.enabled,
    outcome: source.enabled ? 'success' : 'empty',
    operation: source.enabled ? 'curated_metadata_upsert_planned' : 'skipped_authentication_required',
    plannedRecords: catalogue.filter((course) => sourceById.get(course.sourceId) === source.id)
      .length,
  })),
  plannedCourses: catalogue.length,
  sqlPath,
};
await writeFile(sqlPath, `${statements.join('\n')}\n`);
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`course aggregation plan written: ${sqlPath}`);
