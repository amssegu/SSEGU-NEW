import assert from 'node:assert/strict';
import { buildWorkExport, filterPublishableRecords } from './work-export.mjs';

const job = {
  sourceEnabled: true,
  permissionType: 'metadata_only',
  status: 'active',
  slug: 'z-job',
  canonicalUrl: 'https://source.example/jobs/z-job',
};
const course = {
  sourceEnabled: true,
  permissionType: 'redistribute_with_attribution',
  availabilityStatus: 'available',
  slug: 'a-course',
  canonicalUrl: 'https://source.example/courses/a-course',
};

const filtered = filterPublishableRecords({
  jobs: [
    job,
    { ...job, slug: 'private-job', contact_email: 'not-exportable' },
    { ...job, permissionType: 'permission_required' },
    { ...job, canonicalUrl: 'http://unsafe.example/job' },
  ],
  courses: [course, { ...course, canonicalUrl: 'javascript:alert(1)' }],
});
assert.equal(filtered.jobs.length, 1);
assert.equal(filtered.courses.length, 1);

const first = buildWorkExport(
  { mode: 'input', jobs: [job], courses: [course] },
  { generatedAt: '2026-11-15T00:00:00Z' },
);
const second = buildWorkExport(
  { mode: 'input', jobs: [job], courses: [course] },
  { generatedAt: '2026-11-15T00:00:00Z' },
);
assert.deepEqual(first.files, second.files);
assert.equal(first.files.jobs[0].slug, 'z-job');
assert.equal(first.files.courses[0].slug, 'a-course');
assert.throws(
  () => buildWorkExport({ mode: 'input', jobs: [job, { ...job }], courses: [] }),
  /duplicate job slug/,
);
assert.deepEqual(buildWorkExport({ mode: 'empty', jobs: [], courses: [] }).files.manifest.counts, {
  jobs: 0,
  courses: 0,
});
console.log('work export tests passed');
