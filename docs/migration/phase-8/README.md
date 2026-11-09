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

Run the full source rehearsal with the pinned checkout, then promote the
generated content with:

```bash
node scripts/phase7-migration.mjs --source-root=/path/to/amssegu-ssegu \
  --output=/tmp/phase7-full-artifacts --work-ref=474cea16ebf0dd6c8fc5e4ea7d7c5b45e2277fd8
npm run promote:phase8 -- --artifact-root=/tmp/phase7-full-artifacts
```

When using a newly generated full rehearsal, pass its evidence directory to
Phase 8 as well: `npm run migrate:phase8 --
--phase7-artifacts=/tmp/phase7-full-artifacts`.

The migration exceptions are now explicitly dispositioned by the project owner
and published assets are limited to AVIF/WebP. The release gate remains BLOCK
until live probes confirm that `work.ssegu.com` returns the reviewed 301
destinations and the DNS owner records the rollback action.
