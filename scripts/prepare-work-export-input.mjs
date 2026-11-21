import { readFile, writeFile } from 'node:fs/promises';

const queryPath = process.argv[2];
const outputPath = process.argv[3];
if (!queryPath || !outputPath)
  throw new Error('usage: prepare-work-export-input.mjs QUERY_JSON OUTPUT_JSON');

const payload = JSON.parse(await readFile(queryPath, 'utf8'));
const rows = payload.flatMap((result) => (Array.isArray(result.results) ? result.results : []));
const cleanText = (value, limit = 2_000) => {
  if (typeof value !== 'string') return undefined;
  const cleaned = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned ? cleaned.slice(0, limit) : undefined;
};
const asList = (value) => {
  const values = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  return values.map((item) => cleanText(item, 500)).filter(Boolean).slice(0, 12);
};
const jobs = rows.map((row) => {
  let sourceData = {};
  try {
    const value = JSON.parse(row.source_data_json ?? '{}');
    if (value && typeof value === 'object' && !Array.isArray(value)) sourceData = value;
  } catch {
    // An invalid optional source payload must not prevent publishing other listings.
  }
  const mayRedistributeDetails = ['redistribute_with_attribution', 'open_license'].includes(
    row.permission_type,
  );
  return {
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
    ...(mayRedistributeDetails
      ? {
          description:
            cleanText(
              sourceData.description ?? sourceData.description_text ?? sourceData.summary,
            ) ?? undefined,
          requirements: asList(
            sourceData.requirements ?? sourceData.responsibilities ?? sourceData.requirement,
          ),
          qualifications: asList(sourceData.qualifications ?? sourceData.qualification),
          applicationInstructions: cleanText(
            sourceData.applicationInstructions ??
              sourceData.application_instructions ??
              sourceData.how_to_apply,
          ),
        }
      : {}),
  };
});

await writeFile(outputPath, `${JSON.stringify({ mode: 'input', jobs, courses: [] }, null, 2)}\n`);
console.log(`work export input written: jobs=${jobs.length}`);
