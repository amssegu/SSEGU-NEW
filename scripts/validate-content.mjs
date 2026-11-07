import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const csv = readFileSync('project-spec/sample-article-metadata.csv', 'utf8').trim();
const rows = csv.split('\n').slice(1);
assert.equal(rows.length, 35, 'Expected 35 fixture metadata rows');
assert.ok(rows.every((row) => row.endsWith(',fixture,article-placeholder.svg')));
console.log(`fixture content validation passed: ${rows.length} rows`);
