# SSEGU Decap OAuth Worker

This is the separate Cloudflare Worker that authenticates Decap CMS against
GitHub. It is intentionally separate from the Astro Cloudflare Pages project.

The Worker exposes:

- `GET /auth?provider=github` — starts GitHub OAuth.
- `GET /callback?provider=github` — exchanges the GitHub code and returns the
  Decap authorization message.

## 1. Install and authenticate Wrangler

From this directory:

```bash
npm install
npx wrangler login
```

The Cloudflare account used here should be the account that owns the production
authentication service.

## 2. Create the GitHub OAuth App

Deploy the Worker once without secrets, or choose the stable Worker hostname in
advance. For the default `workers.dev` hostname, the callback is:

```text
https://ssegu-decap-auth.<your-account-subdomain>.workers.dev/callback
```

Use these GitHub OAuth App values:

```text
Application name: SSEGU Editorial CMS - Production
Homepage URL: https://ssegu-decap-auth.<your-account-subdomain>.workers.dev
Authorization callback URL: https://ssegu-decap-auth.<your-account-subdomain>.workers.dev/callback
```

The homepage and callback belong to the OAuth proxy, not `/admin/` on the Pages
site. The Worker uses `https://ssegu-new.pages.dev` as the allowed Decap origin by
default.

## 3. Store secrets in Cloudflare

Do not put these values in `wrangler.toml`, Git, or the Pages project:

```bash
npx wrangler secret put GITHUB_OAUTH_ID
npx wrangler secret put GITHUB_OAUTH_SECRET
```

`amssegu/SSEGU-NEW` is private, so `GITHUB_REPO_PRIVATE` is set to `1` in
`wrangler.toml`. This makes the Worker request the `repo` OAuth scope required
for Decap to read and write the repository.

## 4. Deploy and connect Decap

```bash
npm run typecheck
npx wrangler deploy
```

After deployment, set `base_url` in `public/admin/config.yml` to the Worker
origin, without `/callback`:

```yaml
backend:
  name: github
  repo: amssegu/SSEGU-NEW
  branch: main
  base_url: https://ssegu-decap-auth.<your-account-subdomain>.workers.dev
  auth_endpoint: /auth
```

Then deploy the Pages site and test `https://ssegu-new.pages.dev/admin/` in a private
browser window.

## Local testing

Copy `.dev.vars.example` to `.dev.vars`, replace the placeholders locally, and
run:

```bash
npx wrangler dev
```

Do not use local credentials for the production Worker. To test from a local
Decap origin, add `http://localhost:4321` to the comma-separated
`ALLOWED_ORIGINS` variable and register the Worker callback URL in a separate
GitHub OAuth App.
