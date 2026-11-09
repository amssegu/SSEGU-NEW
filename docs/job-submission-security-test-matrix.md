# Employer Submission Security Test Matrix

**Date:** 9 November 2026
**Owner:** SSEGU engineering and Cloudflare project owner

| Test                             | Expected control                                                            | Repository evidence                                       | Result                                    |
| -------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------- |
| Valid submission                 | Turnstile, rate limit and server schema pass; one pending D1 row is created | `functions/api/job-submissions.ts`, D1 migration          | Passed: Cloudflare bindings confirmed     |
| Missing required field           | HTTP 400 with field-safe message; no D1 write                               | `validateSubmission`                                      | Code review passed                        |
| Malformed JSON/form              | HTTP 413/400; no stack or storage detail                                    | `readPayload`                                             | Code review passed                        |
| Request over 64 KiB              | HTTP 413; no D1 write                                                       | `MAX_BODY_BYTES`                                          | Code review passed                        |
| Missing Turnstile token          | HTTP 400; no D1 write                                                       | `verifyTurnstile`, field error                            | Passed: Turnstile functional              |
| Invalid/replayed Turnstile token | HTTP 400; no D1 write                                                       | Siteverify call and failure path                          | Passed: Turnstile functional              |
| Rate limit exceeded              | HTTP 429; no D1 write                                                       | `RATE_LIMIT_KV` binding and fixed-window check             | Passed: KV limit effective                 |
| Storage failure                  | HTTP 503 without database detail                                            | D1 insert catch path                                      | Passed: D1 binding verified               |
| Honeypot request                 | Generic 202; no stored content                                              | `fax` handling                                            | Code review passed                        |
| Output escaping                  | Submitted text is never rendered by the public site                         | No pending-content route; static content collections only | Code review passed                        |
| Secret handling                  | Secret appears only in `env.TURNSTILE_SECRET_KEY`                           | `.env.example` contains names only                        | Code review passed                        |
| D1 permissions                   | Only Function and approved editors can access queue                         | Dashboard binding/runbook requirement                     | Passed: access controls confirmed         |
| Backup/restore                   | Encrypted export restores to isolated D1 and row/status counts reconcile    | Recovery runbook                                          | Passed: recovery confirmed                |
| Public exposure                  | Pending rows absent from routes, sitemap, search and Job structured data    | No public query path; static build                        | Code review passed                        |

## Recovery evidence

The project owner confirmed that a redacted test database export and restore
passed, including migration and queue recovery checks. Never attach contact
emails, descriptions or live credentials.
