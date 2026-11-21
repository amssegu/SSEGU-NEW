import { readFile, writeFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import { buildWorkExport } from './work-export.mjs';

const [domain, inputPath] = process.argv.slice(2);
if (!['jobs', 'courses'].includes(domain) || !inputPath) {
  throw new Error('usage: export-work-snapshot.mjs jobs|courses INPUT_JSON');
}

const input = JSON.parse(await readFile(inputPath, 'utf8'));
if (!Array.isArray(input?.[domain])) throw new Error(`input is missing its ${domain} array`);
const exportInput =
  domain === 'jobs'
    ? { mode: 'snapshot', jobs: input.jobs, courses: [] }
    : { mode: 'snapshot', jobs: [], courses: input.courses };
const snapshot = buildWorkExport(exportInput).files[domain];
const outputPath = `src/data/snapshots/${domain}.json`;
await mkdir('src/data/snapshots', { recursive: true });
await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`${domain} work snapshot written: ${snapshot.length} records`);
