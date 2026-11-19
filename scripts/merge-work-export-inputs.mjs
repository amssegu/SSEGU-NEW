import { readFile, writeFile } from 'node:fs/promises';

const jobsPath = process.argv[2];
const coursesPath = process.argv[3];
const outputPath = process.argv[4];
if (!jobsPath || !coursesPath || !outputPath)
  throw new Error('usage: merge-work-export-inputs.mjs JOBS_JSON COURSES_JSON OUTPUT_JSON');

const jobs = JSON.parse(await readFile(jobsPath, 'utf8'));
const courses = JSON.parse(await readFile(coursesPath, 'utf8'));
await writeFile(
  outputPath,
  `${JSON.stringify({ mode: 'input', jobs: jobs.jobs ?? [], courses: courses.courses ?? [] }, null, 2)}\n`,
);
console.log(
  `combined work export input written: jobs=${jobs.jobs?.length ?? 0} courses=${courses.courses?.length ?? 0}`,
);
