# Work subdomain redirect activation record

Status: **live probe failed; activation requires correction**

The 9 November 2026 probe found that `work.ssegu.com` still served the old
Google-hosted response for a mapped article URL (HTTP 200) and returned HTTP
404 for another mapped URL. It did not return the required 301 responses.

The redirect source remains `work.ssegu.com`. The production provider must keep
the custom hostname attached to the Cloudflare Pages project with DNS and HTTPS
enabled. A Cloudflare Bulk Redirects list must then map each reviewed
`old_url` in `docs/migration/phase-7/artifacts/redirects/dual-site-redirects.csv`
to `https://ssegu.com` plus its `new_url` with status `301`.

Provider settings:

- Source: `https://work.ssegu.com/<old path>`
- Destination: `https://ssegu.com/work/<reviewed destination>`
- Preserve query string: enabled
- Match: exact path from the reviewed map; no catch-all homepage rule
- Missing replacement: return the origin 404/410 response
- Validation: `npm run validate:redirects`, representative probes, loop/chain
  probes and a main-site route-isolation probe

Rollback is to disable the Bulk Redirects list only, leaving the hostname,
certificate and current Pages deployment available. DNS ownership, certificate
status, activation timestamp, probe output and the rollback operator must be
recorded by the deployment owner before Phase 8 can pass.
