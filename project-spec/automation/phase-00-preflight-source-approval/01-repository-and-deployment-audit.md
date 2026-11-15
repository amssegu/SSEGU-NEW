# Phase 00 / Prompt 01 — Repository and deployment audit

Act as a read-only implementation analyst. Read the aggregation specification, source register, implementation plan, existing phase governance, `astro.config.mjs`, `wrangler.toml`, `package.json`, CI workflows, Work routes, content schemas, current migrations and git status.

Document:

- current Pages project/deployment ownership evidence;
- Wrangler and Node versions actually used;
- existing D1/KV bindings and submission-table ownership;
- whether Pages Git builds and GitHub Actions deployments overlap;
- baseline results for lint, test, content validation, build, smoke checks and the known Astro-check segmentation fault;
- files that must not be touched.

Do not change application code, production configuration or external state. Save the audit as `project-spec/automation/phase-00-preflight-source-approval/audit.md`.

The next prompt may run only if the audit is complete and the working tree remains safe.
