import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JUBAJOBS_SOURCE, parseJubaJobsPayload } from './aggregation/adapters/jubajobs.ts';
import { deduplicateJobs } from './aggregation/deduplicate.ts';
import { fetchBounded } from './aggregation/http.ts';
import { canonicalHttpsUrl, normalizeJubaJob, slugify } from './aggregation/normalise.ts';
import { canFetchSource, canRunCoursesThisWeek, canRunJobsToday, mayExpireAfterSuccessfulObservation } from './aggregation/policy.ts';
import { runJobs } from './aggregation/run-jobs.ts';

const valid = JSON.parse(readFileSync('project-spec/content-fixtures/aggregation/jubajobs-jobs-valid.json', 'utf8'));
const partial = JSON.parse(readFileSync('project-spec/content-fixtures/aggregation/jubajobs-jobs-partial.json', 'utf8'));

assert.equal(JUBAJOBS_SOURCE.enabled, false);
assert.equal(JUBAJOBS_SOURCE.endpointUrl, 'https://jubajobs.com/feed/jobs?format=json');
assert.equal(parseJubaJobsPayload(valid).outcome, 'success');
assert.equal(parseJubaJobsPayload(valid).records.length, 2);
assert.equal(parseJubaJobsPayload({ items: [] }).outcome, 'empty');
assert.equal(parseJubaJobsPayload({ items: {} }).outcome, 'malformed');
assert.equal(parseJubaJobsPayload(partial).outcome, 'malformed');

assert.equal(canonicalHttpsUrl('http://example.com/job'), undefined);
assert.equal(canonicalHttpsUrl('https://example.com/job/#fragment'), 'https://example.com/job');
assert.equal(canonicalHttpsUrl('https://evil.example/job', ['jubajobs.com']), undefined);
assert.equal(slugify('Country Director', '366'), 'country-director-366');
const normalized = normalizeJubaJob(parseJubaJobsPayload(valid).records[0], { ...JUBAJOBS_SOURCE, permissionClass: 'metadata_only' }, '2026-11-15T00:00:00.000Z');
assert.equal(normalized.sourceRecordId, '366');
assert.equal(normalized.applicationUrl, undefined);
assert.equal(normalized.workMode, 'unknown');
assert.throws(() => normalizeJubaJob({ ...parseJubaJobsPayload(valid).records[0], canonicalUrl: 'http://unsafe.example/job' }, { ...JUBAJOBS_SOURCE, permissionClass: 'metadata_only' }, '2026-11-15T00:00:00.000Z'), /HTTPS/);

const duplicate = { ...normalized };
assert.equal(deduplicateJobs([normalized, duplicate]).unique.length, 1);
assert.equal(canFetchSource(JUBAJOBS_SOURCE).allowed, false);
assert.equal(canRunJobsToday(['2026-11-15T03:00:00Z', '2026-11-15T15:00:00Z'], new Date('2026-11-15T16:00:00Z')), false);
assert.equal(canRunCoursesThisWeek(['2026-11-10T04:00:00Z', '2026-11-13T04:00:00Z'], new Date('2026-11-15T00:00:00Z')), false);
assert.equal(mayExpireAfterSuccessfulObservation('active', '2026-11-14', new Date('2026-11-15T00:00:00Z')), true);
assert.equal(mayExpireAfterSuccessfulObservation('active', undefined, new Date('2026-11-15T00:00:00Z')), false);

const httpResponse = await fetchBounded('https://example.com/jobs', {
  retries: 0,
  fetchImpl: async () => new Response('{"items":[]}', { status: 200 }),
});
assert.equal(httpResponse.kind, 'success');
const oversized = await fetchBounded('https://example.com/jobs', {
  retries: 0,
  maxBytes: 4,
  fetchImpl: async () => new Response('12345', { status: 200 }),
});
assert.equal(oversized.kind, 'failed');

let fetchCount = 0;
const disabledRun = await runJobs({ source: JUBAJOBS_SOURCE, fetchImpl: async () => { fetchCount += 1; return new Response('{}'); } });
assert.equal(disabledRun.outcome, 'skipped');
assert.equal(fetchCount, 0);

const dbCalls = [];
const fakeDb = { prepare: (query) => ({ bind: (...values) => ({ run: async () => { dbCalls.push({ query, values }); } }) }) };
const enabledSource = { ...JUBAJOBS_SOURCE, enabled: true, permissionClass: 'metadata_only' };
const successfulRun = await runJobs({ source: enabledSource, db: fakeDb, now: new Date('2026-11-15T00:00:00Z'), fetchImpl: async () => new Response(JSON.stringify(valid), { status: 200 }) });
assert.equal(successfulRun.acceptedCount, 2);
assert.equal(dbCalls.length, 5);
assert.match(dbCalls[0].query, /ON CONFLICT\(source_id, source_record_id\)/);
assert.match(dbCalls[0].query, /COALESCE\(excluded\.application_url/);

const jobWithChangedTitle = normalizeJubaJob({ ...parseJubaJobsPayload(valid).records[0], title: 'Country Director Updated' }, enabledSource, '2026-11-15T01:00:00.000Z');
assert.equal(jobWithChangedTitle.sourceRecordId, normalized.sourceRecordId);
assert.notEqual(jobWithChangedTitle.title, normalized.title);
const jobWritesBeforeOutage = dbCalls.filter(({ query }) => query.includes('INSERT INTO jobs')).length;
const outage = await runJobs({ source: enabledSource, db: fakeDb, now: new Date('2026-11-15T02:00:00Z'), fetchImpl: async () => { throw new Error('simulated source outage'); } });
assert.equal(outage.outcome, 'failed');
assert.equal(dbCalls.filter(({ query }) => query.includes('INSERT INTO jobs')).length, jobWritesBeforeOutage);
assert.ok(dbCalls.some(({ query }) => query.includes('INSERT INTO ingestion_runs')));

console.log('aggregation primitive checks passed');
