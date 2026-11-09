# Phase 8 migration, SEO and URL consolidation

Run `npm run migrate:phase8` after the Phase 7 evidence is present. The command
copies the pinned News and Work manifests into a separate Phase 8 evidence
directory, records source/output/manual-review counts, and evaluates the gate.

Run `npm run validate:redirects` to validate the reviewed Phase 7 redirect map
for malformed targets, collisions, loops, chains and blanket homepage
redirects. Query strings are intentionally not stored in the map; meaningful
queries must be preserved by the redirect provider configuration.

Run `npm run generate:redirects` to regenerate the complete checked-in
`public/_redirects` file. It contains all 1,579 verified 301/410 rules, not
just representative examples.

The migration exceptions are now explicitly dispositioned by the project owner
and published assets are limited to AVIF/WebP. The release gate remains BLOCK
until live probes confirm that `work.ssegu.com` returns the reviewed 301
destinations and the DNS owner records the rollback action.
