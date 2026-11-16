import { readFile, writeFile } from 'node:fs/promises';

const queryPath = process.argv[2];
const outputPath = process.argv[3];
if (!queryPath || !outputPath)
  throw new Error('usage: prepare-work-export-input.mjs QUERY_JSON OUTPUT_JSON');

const payload = JSON.parse(await readFile(queryPath, 'utf8'));
const rows = payload.flatMap((result) => (Array.isArray(result.results) ? result.results : []));
const jobs = rows.map((row) => ({
  sourceEnabled: Boolean(row.source_enabled),
  permissionType: row.permission_type,
  status: row.status,
  sourceId: row.source_id,
  canonicalUrl: row.canonical_url,
  applicationUrl: row.application_url ?? undefined,
  slug: row.slug,
  title: row.title,
  employer: row.employer,
  location: row.location,
  country: row.country ?? undefined,
  category: row.category,
  employmentType: row.employment_type,
  workMode: row.work_mode,
  permittedExcerpt: row.permitted_excerpt ?? undefined,
  salaryText: row.salary_text ?? undefined,
  salaryCurrency: row.salary_currency ?? undefined,
  salaryPeriod: row.salary_period ?? undefined,
  publishedAt: row.published_at ?? undefined,
  deadlineAt: row.deadline_at ?? undefined,
  sourceAttribution: row.attribution_text ?? undefined,
  prohibitJobpostingSchema: Boolean(row.prohibit_jobposting_schema),
}));

await writeFile(outputPath, `${JSON.stringify({ mode: 'input', jobs, courses: [] }, null, 2)}\n`);
console.log(`work export input written: jobs=${jobs.length}`);
