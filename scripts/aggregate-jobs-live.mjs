import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getApprovedJobSources } from './aggregation/source-registry.ts';
import { runJobs } from './aggregation/run-jobs.ts';

const now = new Date();
const outputDirectory = process.env.RUNNER_TEMP || '/tmp';
const sqlPath = join(outputDirectory, 'ssegu-aggregation.sql');
const reportPath = join(outputDirectory, 'ssegu-jobs-aggregation-report.json');

function sqlValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function statement(sql, values = []) {
  let index = 0;
  const rendered = sql.replace(/\?/g, () => sqlValue(values[index++]));
  return `${rendered.trim().replace(/;$/, '')};`;
}

class SqlPlanDatabase {
  statements = [];

  prepare(query) {
    return {
      bind: (...values) => ({
        run: async () => {
          this.statements.push(statement(query, values));
          return { success: true };
        },
      }),
    };
  }

  add(query, values = []) {
    this.statements.push(statement(query, values));
  }
}

const database = new SqlPlanDatabase();
database.add("UPDATE content_sources SET enabled = 0, updated_at = ? WHERE id IN ('jubajobs-jobs', 'yubhub-jobs')", [now.toISOString()]);
database.add("DELETE FROM jobs WHERE source_id IN ('jubajobs-jobs','yubhub-jobs')");
const sources = getApprovedJobSources();
const results = [];
const slugRegistry = new Set();

for (const { source, adapter } of sources) {
  const reviewedAt = now.toISOString();
  database.add(
    `INSERT INTO content_sources (id, slug, name, source_type, endpoint_url, terms_url, permission_class, attribution_text, enabled, restriction_flags_json, reviewed_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       endpoint_url = excluded.endpoint_url,
       terms_url = excluded.terms_url,
       permission_class = excluded.permission_class,
       attribution_text = excluded.attribution_text,
       enabled = excluded.enabled,
       restriction_flags_json = excluded.restriction_flags_json,
       reviewed_at = excluded.reviewed_at,
       updated_at = excluded.updated_at`,
    [
      source.id,
      source.slug,
      source.name,
      source.sourceType,
      source.endpointUrl,
      source.termsUrl,
      source.permissionClass,
      source.attributionText ?? null,
      JSON.stringify(source.restrictions),
      reviewedAt,
      reviewedAt,
      reviewedAt,
    ],
  );
  results.push(await runJobs({ source, adapter, db: database, now, slugRegistry }));
}

const report = {
  generatedAt: now.toISOString(),
  reportOnly: false,
  sourceResults: results,
  sqlPath,
  publicDataChanged: results.some((result) => result.acceptedCount > 0),
};

await writeFile(sqlPath, `${database.statements.join('\n')}\n`);
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`live aggregation plan written: ${sqlPath}`);
console.log(`aggregation report written: ${reportPath}`);
