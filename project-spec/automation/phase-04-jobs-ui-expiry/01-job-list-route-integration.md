# Phase 04 / Prompt 01 — Integrate the jobs listing safely

Update the existing `/work/jobs/` route to use shared accessors. Keep active jobs as the default, support explicit expired/all state, derive filter options from data, escape client-rendered values, bound the serialised payload, and keep query filter states out of indexing as required.

Do not create `/jobs/`, change route slugs, remove fixtures or introduce a Worker. Preserve the existing empty state and accessible filter semantics.
