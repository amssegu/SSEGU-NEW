import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { buildWorkExport } from './work-export.mjs';

const execFileAsync = promisify(execFile);

const catalogue = JSON.parse(await readFile('src/data/curated/courses.json', 'utf8'));
const exportResult = buildWorkExport(
  { mode: 'input', jobs: [], courses: catalogue },
  {
    generatedAt: new Date().toISOString(),
  },
);
const datasetHash = exportResult.datasetHash;
const generatedDirectory = 'src/data/generated';
await mkdir(generatedDirectory, { recursive: true });
await writeFile(
  `${generatedDirectory}/courses.json`,
  `${JSON.stringify(exportResult.files.courses, null, 2)}\n`,
);
await writeFile(
  `${generatedDirectory}/manifest.json`,
  `${JSON.stringify(exportResult.files.manifest, null, 2)}\n`,
);

let previousHash = process.env.COURSE_PREVIOUS_DATASET_HASH ?? '';
if (!previousHash) {
  try {
    const { stdout } = await execFileAsync('git', ['show', 'HEAD:src/data/generated/courses.json']);
    previousHash = createHash('sha256').update(stdout.trim()).digest('hex');
  } catch {
    try {
      const { stdout } = await execFileAsync('git', ['show', 'HEAD:src/data/curated/courses.json']);
      const previousCatalogue = JSON.parse(stdout);
      previousHash = buildWorkExport({
        mode: 'input',
        jobs: [],
        courses: previousCatalogue,
      }).datasetHash;
    } catch {
      previousHash = '';
    }
  }
}
const sources = [
  ['mit-ocw', 'MIT OpenCourseWare', 'link_only_catalogue'],
  ['openlearn', 'OpenLearn', 'link_only_catalogue'],
  ['freecodecamp', 'freeCodeCamp', 'link_only_catalogue'],
  ['saylor', 'Saylor Academy', 'skipped_authentication_required'],
];
const report = {
  generatedAt: new Date().toISOString(),
  schedule: '0 4 * * 2,5',
  datasetHash,
  publicDataChanged: previousHash ? previousHash !== datasetHash : true,
  sourceOutcomes: sources.map(([id, name, outcome]) => ({
    sourceId: id,
    source: name,
    outcome,
    lastChecked:
      outcome === 'skipped_authentication_required'
        ? null
        : (catalogue.find((course) => course.sourceId === id)?.lastCheckedAt ?? null),
    unavailableHandling: 'mark unverified until a reliable check succeeds',
  })),
  export: {
    mode: 'curated_link_only',
    counts: exportResult.files.manifest.counts,
    excludedRecords: catalogue.length - exportResult.files.courses.length,
  },
};
const output = process.env.COURSE_REPORT_PATH ?? '/tmp/ssegu-courses-report.json';
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
const exportInput = process.env.COURSE_EXPORT_INPUT_PATH;
if (exportInput) {
  await writeFile(
    exportInput,
    `${JSON.stringify({ mode: 'input', jobs: [], courses: exportResult.files.courses }, null, 2)}\n`,
  );
}
if (process.env.GITHUB_OUTPUT) {
  await writeFile(
    process.env.GITHUB_OUTPUT,
    `dataset_hash=${datasetHash}\npublic_data_changed=${report.publicDataChanged}\n`,
    { flag: 'a' },
  );
}
console.log(JSON.stringify(report));
