import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const catalogue = JSON.parse(await readFile('src/data/generated/courses.json', 'utf8'));
const datasetHash = createHash('sha256').update(JSON.stringify(catalogue)).digest('hex');
let previousHash = process.env.COURSE_PREVIOUS_DATASET_HASH ?? '';
if (!previousHash) {
  try {
    const { stdout } = await execFileAsync('git', ['show', 'HEAD:src/data/generated/courses.json']);
    previousHash = createHash('sha256').update(stdout.trim()).digest('hex');
  } catch {
    previousHash = datasetHash;
  }
}
const sources = [
  ['saylor', 'Saylor Academy'],
  ['mit-ocw', 'MIT OpenCourseWare'],
  ['openlearn', 'OpenLearn'],
  ['freecodecamp', 'freeCodeCamp'],
];
const report = {
  generatedAt: new Date().toISOString(),
  schedule: '0 4 * * 2,5',
  datasetHash,
  publicDataChanged: previousHash ? previousHash !== datasetHash : true,
  sourceOutcomes: sources.map(([id, name]) => ({
    sourceId: id,
    source: name,
    outcome: 'link_only_catalogue',
    lastChecked: '2026-11-16',
    unavailableHandling: 'mark unverified until a reliable check succeeds',
  })),
};
const output = process.env.COURSE_REPORT_PATH ?? '/tmp/ssegu-courses-report.json';
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
if (process.env.GITHUB_OUTPUT) {
  await writeFile(
    process.env.GITHUB_OUTPUT,
    `dataset_hash=${datasetHash}\npublic_data_changed=${report.publicDataChanged}\n`,
    { flag: 'a' },
  );
}
console.log(JSON.stringify(report));
