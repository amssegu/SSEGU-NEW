# Deployment Foundation

## Cloudflare Pages

The application is configured for static Astro output. Use:

```text
Root directory: /
Build command: npm run build
Build output directory: dist
Node.js version: 22.23.2
```

The current project is `ssegu-new` at `https://ssegu-new.pages.dev/`. No DNS or Work-site settings are changed by this repository.

`wrangler.toml` declares `pages_build_output_dir = "./dist"`, but the connected Git build still needs the dashboard Build command. In Cloudflare, open **Workers & Pages → ssegu-new → Settings → Builds & deployments**, then set the root directory to `/`, the build command to `npm run build`, and the output directory to `dist`. Add the production environment variable `NODE_VERSION=22.23.2` if the dashboard does not read `.nvmrc`. Save, then trigger a new deployment from `main`.

The error `No build command specified. Skipping build step` means Cloudflare skipped Astro entirely; it is expected that `dist/` does not exist until `npm run build` runs.

The project currently has no separately provisioned local or preview Cloudflare environment. This is an explicit interim decision for development, not a claim that preview isolation exists. Before client handover, create/verify the client's preview and production separation or record an approved equivalent control.

## Local checks

```text
npm ci
npm run format:check
npm run lint
npm run check
npm test
npm run validate:content
npm run build
npm run test:e2e
```

## Rollback entry point

Rollback is performed by redeploying a previously verified Git commit through Cloudflare Pages. Record the commit, deployment URL and reason in the release record. Do not claim a rollback rehearsal until it has been performed.

