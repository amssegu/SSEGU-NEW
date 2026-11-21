import { readFile } from 'node:fs/promises';

const [reportPath, runsPath, jobsPath, coursesPath] = process.argv.slice(2);
if (!reportPath || !runsPath) {
  throw new Error(
    'usage: verify-aggregation-output.mjs REPORT_JSON RUNS_JSON [JOBS_JSON] [COURSES_JSON]',
  );
}

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const report = await readJson(reportPath);
const runsPayload = await readJson(runsPath);
const runs = (Array.isArray(runsPayload) ? runsPayload : [runsPayload]).flatMap((item) =>
  Array.isArray(item?.results) ? item.results : [],
);

if (!report.generatedAt || !Array.isArray(report.sourceResults)) {
  throw new Error('aggregation report is missing generatedAt or sourceResults');
}
if (report.sourceResults.length && report.sourceResults.every((source) => source.outcome === 'failed')) {
  throw new Error('all configured aggregation sources failed');
}

for (const source of report.sourceResults) {
  const run = runs.find(
    (candidate) =>
      candidate.source_id === source.sourceId && candidate.started_at === report.generatedAt,
  );
  if (!run) throw new Error(`missing D1 ingestion run for ${source.sourceId}`);
  if (run.result !== source.outcome) {
    throw new Error(
      `D1 result mismatch for ${source.sourceId}: report=${source.outcome} d1=${run.result}`,
    );
  }
  if (source.acceptedCount !== undefined && run.accepted_count !== source.acceptedCount) {
    throw new Error(`accepted count mismatch for ${source.sourceId}`);
  }
}

for (const [label, path] of [
  ['jobs', jobsPath],
  ['courses', coursesPath],
]) {
  if (!path) continue;
  const payload = await readJson(path);
  if (!Array.isArray(payload) || payload.some((item) => !Array.isArray(item?.results))) {
    throw new Error(`${label} D1 verification response is malformed`);
  }
  const records = payload.flatMap((item) => item.results);
  if (records.some((record) => !(Number(record.source_data_bytes) > 2))) {
    throw new Error(`${label} D1 records are missing their captured source payload`);
  }
}

console.log(`verified D1 ingestion runs: ${report.sourceResults.length}`);
