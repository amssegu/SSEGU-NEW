# Phase 4 Work Route Map

All routes below are owned by the Work frontend and are statically generated
from `src/lib/work.ts` or local route fixtures. News retains ownership of the
root-level dynamic article route and has no route under `/work/`.

| Route | Owner | Fixture behavior |
| --- | --- | --- |
| `/work/` | Work homepage | Hero, latest jobs, career advice, quick links, updates and trust strip |
| `/work/jobs/` | Work jobs listing | Keyword, location, employment type, arrangement and status filters |
| `/work/jobs/{slug}/` | Work job detail | Job metadata, active/expired state and deferred application notice |
| `/work/internships/` | Work internships listing | Fixture placement cards |
| `/work/internships/{slug}/` | Work internship detail | Placement metadata and deferred application notice |
| `/work/career-advice/` | Work advice listing | Fixture advice cards |
| `/work/career-advice/{slug}/` | Work advice detail | Fixture reading view |
| `/work/courses/` | Work courses listing | Fixture skills resources |
| `/work/courses/{slug}/` | Work course detail | Fixture resource detail and deferred access |
| `/work/cv-resources/` | Work CV resources listing | Fixture application resources |
| `/work/cv-resources/{slug}/` | Work CV resource detail | Fixture resource detail |
| `/work/employers/` | Work employer information | Editorial employer information only |
| `/work/submit-job/` | Work deferred submission boundary | Explicitly non-operational, `noindex` fixture page |

No Work route imports CMS, migration data, external APIs or a backend function.

