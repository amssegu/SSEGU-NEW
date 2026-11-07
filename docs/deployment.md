# Deployment Foundation

## Cloudflare Pages

The application is configured for static Astro output. Use:

```text
Build command: npm run build
Output directory: dist
```

The current project is `https://ssegu.pages.dev/`. No DNS or Work-site settings are changed by this repository.

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

