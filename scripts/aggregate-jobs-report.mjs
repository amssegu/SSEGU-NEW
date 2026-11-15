import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getApprovedJobSources, JOB_SOURCE_REGISTRY } from './aggregation/source-registry.ts';
import { canFetchSource } from './aggregation/policy.ts';
import { runJobs } from './aggregation/run-jobs.ts';

const reportOnly = process.env.AGGREGATION_REPORT_ONLY !== 'false';
const now = new Date();
const unexpectedEnabled = JOB_SOURCE_REGISTRY.filter(
  ({ source }) =>
    source.enabled &&
    !getApprovedJobSources().some(({ source: approved }) => approved.id === source.id),
);
if (unexpectedEnabled.length) throw new Error('unapproved source is enabled');

const results = [];
for (const { source, adapter } of getApprovedJobSources()) {
  const permission = canFetchSource(source, undefined, now);
  if (reportOnly || !permission.allowed) {
    results.push({
      sourceId: source.id,
      outcome: 'skipped',
      reason: reportOnly ? 'report-only mode' : permission.reason,
    });
    continue;
  }
  results.push(await runJobs({ source, adapter, now }));
}

const report = {
  generatedAt: now.toISOString(),
  reportOnly,
  sourceResults: results.map(
    ({
      sourceId,
      outcome,
      fetchedCount = 0,
      acceptedCount = 0,
      rejectedCount = 0,
      errorSummary,
      reason,
    }) => ({
      sourceId,
      outcome,
      fetchedCount,
      acceptedCount,
      rejectedCount,
      errorSummary: errorSummary ?? reason,
    }),
  ),
  publicDataChanged: false,
};
const output = join(process.env.RUNNER_TEMP || '/tmp', 'ssegu-jobs-aggregation-report.json');
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`aggregation report written: ${output}`);
