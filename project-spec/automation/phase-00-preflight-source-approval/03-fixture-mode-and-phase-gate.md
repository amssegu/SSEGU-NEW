# Phase 00 / Prompt 03 — Establish fixture-only mode and gate Phase 00

Implement only the minimum additive local mechanism needed to build and test Work without production D1 credentials. It must be explicit, deterministic and disabled in production. Do not replace the existing fixture arrays or publish draft content.

Add or update documentation/tests so contributors can tell whether generated data is fixture, empty, or production-exported. Validate that existing Work routes, employer submissions and News routes remain unchanged.

Run the baseline test/build suite and inspect `git diff`.

Gate requirements:

- audit and permission register exist;
- deployment ownership is resolved or explicitly blocked;
- every unapproved source remains disabled;
- fixture mode does not require secrets;
- existing tests/build/smoke checks pass, apart from the separately documented checker crash;
- no destructive changes or production writes occurred.

Write `phase-00-gate.md` with `PROCEED` or `BLOCK`, evidence, unresolved risks and the exact next prompt. Proceed only on `PROCEED`.
