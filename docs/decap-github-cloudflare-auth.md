# Decap CMS GitHub and Cloudflare Authentication Runbook

This runbook configures the Decap CMS at `/admin/` to authenticate editors
through GitHub and commit content to the repository. It also records the
ownership and handoff steps required when this project moves to a client-owned
GitHub and Cloudflare account.

The procedure below uses a separate Cloudflare Worker as the OAuth proxy. The
Astro site remains a static Cloudflare Pages deployment. The proxy is not the
same deployment as the site and must not be added to this repository's
`wrangler.toml` unless the implementation is deliberately changed to use a
Pages Function.

## 1. Understand the pieces

The completed flow is:

```text
Editor
  │
  ├── opens https://SITE_DOMAIN/admin/
  │
  ├── Decap opens AUTH_PROXY_URL/auth
  │       │
  │       ├── redirects to GitHub OAuth
  │       └── receives GitHub code at AUTH_PROXY_URL/callback
  │
  └── Decap receives the authenticated session
          │
          └── GitHub API reads/writes SITE_REPO on SITE_BRANCH
                  │
                  └── merge to main triggers Cloudflare Pages build
```

There are five independent configuration surfaces:

| Surface | Example | Owner | Contains secrets? |
| --- | --- | --- | --- |
| Site repository | `c4rrotJuice/ssegu` | GitHub account or client organisation | No |
| Decap config | `public/admin/config.yml` | This repository | No |
| GitHub OAuth App | `SSEGU Editorial CMS` | GitHub account or organisation | Client secret exists |
| OAuth proxy | `https://cms-auth.example.com` | Cloudflare account | OAuth client ID/secret |
| Astro site | `https://ssegu.pages.dev` or production domain | Cloudflare Pages account | Runtime/build secrets as applicable |

Do not put the GitHub client secret, Cloudflare API token, or an access token in
`config.yml`, an Astro public variable, `public/`, a committed `.env` file or a
GitHub Actions log.

## 2. Record the values before setup

Fill in this table in the deployment record before creating resources. Keep the
record in the client's private handoff system if it contains operational
details; do not store secrets in this repository.

| Variable | Current project value or placeholder |
| --- | --- |
| `SITE_REPO` | `c4rrotJuice/ssegu` |
| `SITE_BRANCH` | `main` |
| `SITE_ADMIN_URL` | `https://<production-domain>/admin/` |
| `SITE_PREVIEW_ADMIN_URL` | `https://<preview-domain>/admin/` |
| `AUTH_PROXY_URL` | `https://<auth-subdomain>` |
| `GITHUB_CALLBACK_URL` | `${AUTH_PROXY_URL}/callback` |
| `PAGES_PROJECT` | `ssegu` (confirm in the Cloudflare dashboard) |
| `PAGES_OUTPUT_DIRECTORY` | `dist` |

Use a stable proxy hostname that the client will control after handoff. A
`workers.dev` hostname is acceptable for a prototype; a client-owned custom
subdomain is preferable for production continuity.

## 3. Confirm the repository is ready

1. Confirm the repository exists at the exact `owner/name` used in Decap. The
   current configuration points to `c4rrotJuice/ssegu`.
2. Confirm the publishing branch is `main`.
3. Confirm the repository contains:
   - `public/admin/index.html`;
   - `public/admin/config.yml`;
   - `src/content.config.ts`;
   - the `src/content/` collection directories.
4. Confirm the CI checks pass locally:

   ```bash
   npm ci
   npm run validate:content
   npm run check
   npm run build
   npm test
   npm run test:e2e
   ```

5. Confirm `/admin/` is not linked from public navigation or the sitemap. The
   admin page must retain `noindex, nofollow`.
6. Decide who may publish. The current configuration uses
   `publish_mode: editorial_workflow`, so edits should move through a draft,
   review and merge process.

Decap's GitHub backend writes to the repository named in `config.yml`; it does
not automatically use whichever repository happens to contain a cloned copy of
the CMS interface. [Decap configuration options](https://decapcms.org/docs/configuration-options/)

## 4. Create the GitHub OAuth App

Perform this step while signed in to the GitHub account or organisation that
will own the production repository and CMS integration.

1. Open GitHub **Settings → Developer settings → OAuth Apps**.
2. Choose **New OAuth App**.
3. Use a clear name, such as `SSEGU Editorial CMS - Production`.
4. Set **Homepage URL** to the OAuth proxy URL:

   ```text
   https://cms-auth.example.com
   ```

   Do not use the GitHub repository URL as the homepage unless that is a
   deliberate product decision.

5. Set **Authorization callback URL** to:

   ```text
   https://cms-auth.example.com/callback
   ```

   Do not use `https://<site-domain>/admin/` as the callback. GitHub sends the
   OAuth code to the proxy, and the proxy returns the result to the Decap
   window.

6. Register the application.
7. Copy the **Client ID** into the private deployment record.
8. Generate a **Client Secret** and copy it once into the private deployment
   record or directly into Cloudflare. Do not commit it.
9. If GitHub offers multiple callback URLs, add only the exact production
   callback and any explicitly approved preview callback. Avoid wildcard
   callbacks unless every matching subdomain is controlled; GitHub warns that
   wildcard callbacks increase the risk of redirecting authorization codes to
   an unintended host. [GitHub OAuth app creation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)

The OAuth application identifies the user and obtains a token. It does not
replace repository permissions. The signed-in editor must still have the
required access to `SITE_REPO`. [GitHub OAuth authorization model](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps)

## 5. Deploy the Cloudflare OAuth proxy

### 5.1 Choose the proxy source

Decap requires an OAuth handler for a self-hosted GitHub backend. Decap's
backend documentation describes the required `/auth` and `/callback` paths and
links to Cloudflare Worker examples. [Decap GitHub OAuth proxy guidance](https://decapcms.org/docs/backends-overview/)

This repository includes a separate Worker project at
[`infra/decap-auth`](../infra/decap-auth/). It implements the Decap-compatible
`/auth` and `/callback` routes, signs the OAuth state, restricts callback
messages to configured site origins and keeps the GitHub credentials in
Cloudflare secrets.

```bash
cd infra/decap-auth
npm install
npx wrangler login
```

Treat the Worker as an independent application with its own deployment and
rollback history. The root `wrangler.toml` belongs to the Astro Pages site; do
not merge the Worker configuration into it. Do not commit the Worker secrets.

### 5.2 Create or select the Cloudflare Worker

1. Sign in to the Cloudflare account that should own the production
   authentication service.
2. Choose a Worker name, for example `ssegu-decap-auth`.
3. Decide whether to use the generated `workers.dev` hostname or a custom
   hostname such as `cms-auth.example.com`.
4. If using a custom hostname, ensure the DNS zone is in the same client-owned
   Cloudflare account and bind the hostname to the Worker.
5. Authenticate Wrangler from `infra/decap-auth`:

   ```bash
   npx wrangler login
   ```

6. Review `infra/decap-auth/wrangler.toml`. Do not commit a file containing
   secrets.

### 5.3 Add encrypted Worker secrets

This repository's Worker expects the following encrypted secret names:

```bash
npx wrangler secret put GITHUB_OAUTH_ID
npx wrangler secret put GITHUB_OAUTH_SECRET
```

Paste the GitHub OAuth **Client ID** and **Client Secret** only when Wrangler
prompts for them. If the repository is private, set `GITHUB_REPO_PRIVATE=1` in
the Worker configuration before deployment. Never use a GitHub personal access
token as a replacement for the OAuth client secret.

Cloudflare also permits adding encrypted secrets through **Workers & Pages →
Worker → Settings → Variables and Secrets**. Select the encrypted/secret type,
not a public variable. [Cloudflare Worker and Pages secrets](https://developers.cloudflare.com/pages/functions/bindings/)

### 5.4 Deploy and test the proxy

From `infra/decap-auth`:

```bash
npm run typecheck
npx wrangler deploy
```

Then verify:

1. Open `https://cms-auth.example.com` in a browser and confirm the Worker
   responds.
2. Open `https://cms-auth.example.com/auth` in a private window. It should
   begin a GitHub authorization flow or return the proxy's expected auth error
   when required parameters are absent.
3. Confirm the callback hostname is HTTPS and resolves to the Worker.
4. Confirm no secret value appears in Worker logs, the browser URL, the public
   site bundle or the repository.
5. Record the Worker deployment ID/version and URL in the deployment record.

The proxy is ready only when both `/auth` and `/callback` are reachable through
the same `AUTH_PROXY_URL` used by Decap.

## 6. Connect Decap to the proxy

Edit the backend block in
[`public/admin/config.yml`](../public/admin/config.yml):

```yaml
backend:
  name: github
  repo: c4rrotJuice/ssegu
  branch: main
  base_url: https://cms-auth.example.com
  auth_endpoint: /auth

publish_mode: editorial_workflow
```

Rules:

- `repo` must exactly match the GitHub owner and repository name.
- `branch` must be the branch Cloudflare Pages builds from.
- `base_url` is the proxy origin, not the site origin and not `/admin/`.
- `auth_endpoint` must match the proxy's auth route.
- Keep `publish_mode: editorial_workflow` while editorial review is required.
- Keep `media_folder: public/uploads` and `public_folder: /uploads` aligned
  with the repository and the Astro content guidance.
- `local_backend` is only for local `decap-server` development. It must be
  disabled or removed from the deployed configuration unless a deliberate
  local-backend setup is being used.

After changing the configuration, run:

```bash
npm run validate:content
npm run check
npm run build
```

The built site must contain `dist/admin/index.html` and
`dist/admin/config.yml`.

## 7. Configure Cloudflare Pages

The existing site deployment is separate from the OAuth Worker.

1. In Cloudflare **Workers & Pages**, open the Pages project for the site.
2. Confirm the connected GitHub repository is `SITE_REPO`.
3. Configure:
   - Root directory: `/`;
   - Build command: `npm run build`;
   - Output directory: `dist`;
   - Node.js: 22 or the version recorded by the project.
4. Configure the production custom domain, if one is approved.
5. Configure a preview deployment strategy before enabling CMS preview links.
6. Keep production and preview variables/secrets separated. A preview must not
   receive production-only credentials.
7. Deploy the commit containing the backend configuration.
8. Confirm these URLs load:
   - `https://SITE_DOMAIN/`;
   - `https://SITE_DOMAIN/admin/`;
   - `https://SITE_DOMAIN/admin/config.yml`.

The site deploy must complete before testing login through the production
admin URL. Cloudflare Pages variables and secrets are managed under the Pages
project's settings; Worker OAuth secrets belong to the separate Worker.

## 8. Configure GitHub repository permissions and protection

1. Open the GitHub repository **Settings → Collaborators and teams**.
2. Add named editors individually or through an approved team.
3. Grant the minimum repository role compatible with the chosen Decap backend.
   The standard GitHub backend requires repository write access for editors.
4. Do not share a single administrator account.
5. Protect `main` with:
   - pull requests required before merge;
   - at least one reviewer for editorial changes;
   - required CI status checks;
   - no direct pushes for editors unless explicitly approved;
   - administrator bypass limited to named maintainers.
6. Confirm the Cloudflare Pages build is triggered by the merge event.
7. If the repository belongs to an organisation, check the organisation's
   OAuth app approval policy and approve the OAuth App if required.

The OAuth App's permissions and the repository's collaborator permissions are
separate controls. Removing a user from the repository must remove their CMS
publishing ability even if they previously authorized the OAuth App.

## 9. Perform the editor acceptance test

Use a named non-developer editor in a production-like environment. Record the
date, account, environment, result and evidence URL in the Phase 5 acceptance
record.

### Login and draft privacy

1. Open `/admin/` in a private browser window.
2. Choose **Login with GitHub**.
3. Confirm GitHub shows the expected OAuth application and requested access.
4. Authorize with an account that has the approved repository role.
5. Confirm the popup closes and Decap loads the CMS.
6. Confirm an account without repository access cannot edit the repository.

### News article

1. Create a News article.
2. Enter title, slug, excerpt and Markdown body.
3. Select an existing author and News category.
4. Add an approved image, alt text, caption and credit.
5. Save it as a draft.
6. Confirm the draft appears in the editorial workflow and is not public.
7. Open the preview and verify layout, metadata and image details.
8. Correct one field and save again.
9. Submit it for review and merge it using the protected GitHub workflow.
10. Confirm Cloudflare Pages rebuilds and the published output is correct.

### Work job

1. Create a Work job.
2. Select an existing employer.
3. Enter location, arrangement, employment type and description.
4. Enter a verified source URL and verification note.
5. Select one application method and provide its matching detail:
   - `external-url` → application URL;
   - `email` → application email;
   - `instructions` → application instructions.
6. Save a draft and confirm it is not public.
7. Submit it for review, correct a mistake and merge it.
8. Confirm the published job uses the Work route namespace and does not enter
   the News collection.
9. Confirm an expired job is not represented as an active vacancy.

### Restore test

1. Make a harmless correction to the test article or job.
2. Merge it and confirm the deployment.
3. Restore the previous Git commit or revert the pull request through GitHub.
4. Confirm the next Cloudflare deployment restores the previous content.
5. Record the commit IDs and deployment URLs.

Do not mark Phase 5 as PASS until this acceptance test and the OAuth callback
test are complete. The local repository can validate schemas, but it cannot
prove the external GitHub and Cloudflare setup.

## 10. Validate the completed setup

Run the repository checks:

```bash
npm run validate:content
npm run check
npm test
npm run build
npm run test:e2e
git diff --check
```

Then perform these browser and deployment checks:

- `/admin/` loads with `noindex, nofollow`;
- `/admin/config.yml` is reachable but no secret appears in it;
- login succeeds from the production admin URL;
- the OAuth callback is HTTPS and uses the exact registered URL;
- a draft creates the expected branch/PR and remains private;
- a merged article and job deploy successfully;
- the sitemap contains no `/admin/` URL;
- an editor removed from GitHub loses write access;
- Worker and Pages logs contain no OAuth client secret or access token.

## 11. Troubleshooting

| Symptom | Likely cause | Check |
| --- | --- | --- |
| `redirect_uri_mismatch` | GitHub callback does not exactly match the proxy callback | Compare GitHub OAuth App callback, `AUTH_PROXY_URL` and proxy route |
| Login popup closes immediately | Proxy cannot post the result to the Decap origin | Check proxy logs, HTTPS, `base_url`, origin handling and browser console |
| `origin not allowed` | Admin origin is not allowed by the proxy or hosted auth service | Add the exact production/preview admin origin; avoid broad wildcards |
| Repository not found | Wrong `owner/name`, wrong branch or OAuth user lacks access | Compare `repo` with the GitHub URL and test the editor's repository access |
| Permission denied on save | Editor has read-only access or organisation policy blocks the app | Grant the approved repository role and approve the OAuth App if required |
| Draft is public | Editorial workflow is disabled or the build reads draft content | Check `publish_mode`, collection status handling and the deployed commit |
| CMS uses local backend | `local_backend` is enabled while `decap-server` is running or configured | Disable/remove `local_backend` in the deployed config |
| Preview link is missing | Cloudflare deploy status is not configured for Decap | Configure the correct preview status or use the production review path |
| Changes save but site does not update | Pages is connected to another repo/branch or build failed | Check Pages source, build log, output directory and commit branch |

## 12. Client handoff and portability

### Recommended ownership model

Before launch, the client should own or control the following:

- the GitHub organisation/repository;
- the GitHub OAuth App;
- the Cloudflare account, Pages project and custom domain;
- the Cloudflare OAuth Worker and encrypted secrets;
- GitHub branch protection and editor teams;
- the deployment and rollback records.

### If the client keeps the same repository

If ownership of the exact repository is transferred, update the deployment
record and confirm:

1. the repository owner still matches `backend.repo`;
2. the OAuth App is transferred or recreated under the client owner;
3. the client Cloudflare account owns the Worker and Pages project;
4. OAuth secrets are re-entered into the client Worker;
5. DNS and custom-domain bindings point to the client account;
6. the client editor accounts can log in and publish a test draft.

### If the client clones into a new repository

The content model, `src/content/` files, schemas, Decap collections and CI
configuration can be copied. The following must be changed or recreated:

1. Change `backend.repo` to the client `owner/name`.
2. Confirm the client branch name.
3. Create a client-owned GitHub OAuth App and register the client proxy
   callback URL.
4. Create a client-owned Cloudflare Worker and add new encrypted OAuth secrets.
5. Update `base_url` to the client proxy URL.
6. Create or transfer the client Cloudflare Pages project.
7. Connect the client repository to Pages and configure build/output settings.
8. Configure the client domain and preview environment.
9. Add client editors and protect the client `main` branch.
10. Repeat the full editor acceptance test.

Cloning the repository does not clone GitHub OAuth authorizations, Cloudflare
Workers, secrets, DNS, Pages projects or repository permissions. An OAuth App
can technically be reused or transferred, but it is not automatically usable
by a new repository owner; a client-owned OAuth App and Worker provide the
cleanest security and support boundary. GitHub documents OAuth App ownership
transfer under its maintenance guidance. [GitHub OAuth App maintenance](https://docs.github.com/en/apps/oauth-apps/maintaining-oauth-apps)

## 13. Required evidence before Phase 5 PASS

Store these artifacts in the private delivery record:

- exact GitHub repository and branch;
- OAuth App name, owner and callback URL, but never the client secret;
- Worker name, hostname and deployment version, but never its secrets;
- Cloudflare Pages project, production URL and preview URL;
- editor accounts/teams and repository roles;
- successful login evidence;
- News article acceptance evidence;
- Work job acceptance evidence;
- draft privacy evidence;
- correction and restore evidence;
- repository validation and build output;
- unresolved issues, owner and next action.

Authentication is not considered verified merely because the admin page loads.
The callback, repository write, draft privacy, deployment and restore paths all
need evidence.
