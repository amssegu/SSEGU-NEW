import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildWorkExport } from './work-export.mjs';

const outputDirectory = join(process.cwd(), 'src/data/generated');
const mode = process.env.WORK_EXPORT_MODE ?? 'empty';
const timestamp = process.env.WORK_EXPORT_TIMESTAMP ?? null;

const fixture = {
  mode: 'fixture',
  jobs: [
    {
      id: 'fixture-imported-job-1',
      sourceId: 'fixture-source',
      sourceRecordId: 'fixture-1',
      canonicalUrl: 'https://example.com/fixture/imported-job-1',
      slug: 'fixture-imported-job-1',
      title: 'Fixture Imported Job',
      employer: 'Fixture Source Employer',
      location: 'Kampala',
      category: 'Operations',
      employmentType: 'full_time',
      workMode: 'hybrid',
      permittedExcerpt: 'A synthetic imported record for deterministic build tests.',
      publishedAt: '2026-11-15T00:00:00Z',
      deadlineAt: '2026-12-15',
      status: 'active',
      permissionType: 'metadata_only',
      sourceEnabled: true,
    },
  ],
  courses: [],
};

let input = { mode, jobs: [], courses: [] };
if (mode === 'fixture') input = fixture;
if (mode === 'input') {
  if (!process.env.WORK_EXPORT_INPUT)
    throw new Error('WORK_EXPORT_INPUT is required when WORK_EXPORT_MODE=input');
  input = { ...JSON.parse(await readFile(process.env.WORK_EXPORT_INPUT, 'utf8')), mode };
}
if (!['empty', 'fixture', 'input'].includes(mode)) {
  throw new Error(`Unsupported WORK_EXPORT_MODE: ${mode}. Use empty, fixture, or input.`);
}

const result = buildWorkExport(input, { generatedAt: timestamp });
await mkdir(outputDirectory, { recursive: true });
await writeFile(
  join(outputDirectory, 'jobs.json'),
  `${JSON.stringify(result.files.jobs, null, 2)}\n`,
);
await writeFile(
  join(outputDirectory, 'courses.json'),
  `${JSON.stringify(result.files.courses, null, 2)}\n`,
);
await writeFile(
  join(outputDirectory, 'manifest.json'),
  `${JSON.stringify(result.files.manifest, null, 2)}\n`,
);
console.log(
  `work export written: mode=${mode} jobs=${result.files.manifest.counts.jobs} courses=${result.files.manifest.counts.courses} hash=${result.datasetHash}`,
);
