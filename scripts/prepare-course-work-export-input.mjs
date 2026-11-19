import { readFile, writeFile } from 'node:fs/promises';

const queryPath = process.argv[2];
const outputPath = process.argv[3];
if (!queryPath || !outputPath)
  throw new Error('usage: prepare-course-work-export-input.mjs QUERY_JSON OUTPUT_JSON');

const payload = JSON.parse(await readFile(queryPath, 'utf8'));
const rows = payload.flatMap((result) => (Array.isArray(result.results) ? result.results : []));
const courses = rows.map((row) => ({
  sourceEnabled: Boolean(row.source_enabled),
  permissionType: row.permission_type,
  availabilityStatus: row.availability_status,
  sourceId: row.source_id,
  canonicalUrl: row.canonical_url,
  enrolmentUrl: row.enrolment_url ?? undefined,
  slug: row.slug,
  title: row.title,
  provider: row.provider,
  summary: row.summary ?? undefined,
  subject: row.subject ?? undefined,
  level: row.level ?? undefined,
  deliveryMode: row.delivery_mode,
  language: row.language ?? undefined,
  duration: row.duration ?? undefined,
  coursePriceStatus: row.course_price_status,
  certificatePriceStatus: row.certificate_price_status,
  termsUrl: row.terms_url ?? undefined,
  sourceAttribution: row.attribution_text ?? undefined,
  lastCheckedAt: row.last_seen_at ?? undefined,
}));

await writeFile(outputPath, `${JSON.stringify({ mode: 'input', jobs: [], courses }, null, 2)}\n`);
console.log(`course work export input written: courses=${courses.length}`);
