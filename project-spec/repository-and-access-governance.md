# Repository and Access Governance

**Status:** Current governance record; project-owner confirmations recorded, selected controls remain to be evidenced  
**Prepared:** 7 November 2026  
**Observed repository:** `https://github.com/c4rrotJuice/ssegu`  
**Observed local branch:** `main`  
**Project owner/final authority:** Andronicus Enoch M.  
**Cloudflare Pages project:** `https://ssegu-new.pages.dev/`

## 1. Source-control model

| Control | Required arrangement | Evidence/status |
|---|---|---|
| Repository owner | Andronicus Enoch M. owns and controls the authoritative repository | Confirmed by project owner |
| Production branch | `main` | Local branch and remote default convention observed; protection confirmed by project owner |
| Feature branches | `feature/<short-name>` or `fix/<short-name>` from `main` | Policy to apply |
| Pull requests | Required for changes to `main`; direct pushes disabled after administration | Intended control; not configured/evidenced |
| Reviewers | Andronicus Enoch M. is currently the project owner, technical reviewer and release approver | Confirmed single-owner model; second reviewer not currently available |
| Branch protection | Required status checks, conversation resolution, linear/reviewed merge and no force-push/delete | GitHub administration still required |
| Releases | Annotated `vMAJOR.MINOR.PATCH` tags from reviewed `main` commits | Policy to apply |

No GitHub setting is represented as complete until a repository administrator supplies independently checkable evidence, such as a settings record or successful protected-branch PR.

## 2. Roles and least privilege

| Role | Required access | Boundary |
|---|---|---|
| Project owner | Andronicus Enoch M.; approves scope, routes, providers, launch and exceptions | Current final authority |
| Technical lead | Andronicus Enoch M.; repository administration, CI/deployment configuration, release and rollback | Current combined role |
| Implementer | Andronicus Enoch M.; repository write and production implementation | Current combined role |
| Editor | Not yet delegated; project owner may perform editorial work during implementation | No additional editor access currently granted |
| Reviewer/QA | Andronicus Enoch M. until client/reviewer delegation occurs | Single-reviewer risk recorded |
| Deployment administrator | Andronicus Enoch M.; Cloudflare project/deployment settings and production secrets | Current combined role |

Shared administrator accounts are prohibited. Access must be reviewed at onboarding, role change and offboarding.

## 3. Environments and secret boundaries

| Environment | Purpose | Public configuration | Secrets |
|---|---|---|---|
| Local | Not currently provisioned; work is being performed against the production project workflow | Not applicable currently | No local secret arrangement has been claimed |
| Preview | Not currently provisioned | Not applicable currently | No preview access or secrets are claimed |
| Production | Current implementation/deployment environment at `ssegu-new.pages.dev/` | Public site configuration only | Cloudflare/Decap/OAuth secrets must remain in the production secret store only |

Never commit OAuth client secrets, Cloudflare tokens, private service tokens or email keys. Client bundles may contain only intentionally public configuration.

## 4. External administration register

| Item | Owner to confirm | Current status / evidence required |
|---|---|---|
| GitHub repository ownership and collaborators | Andronicus Enoch M. | Confirmed by project owner; remote is authoritative |
| `main` protection and required checks | Andronicus Enoch M. | Confirmed configured by project owner |
| GitHub OAuth application/callback | Andronicus Enoch M. | Must be selected and tested during Phase 4; no credentials requested or recorded |
| Cloudflare Pages project and GitHub connection | Andronicus Enoch M. | Project reported created and linked at `https://ssegu-new.pages.dev/`; deployment evidence should be retained |
| Local/preview/production environment settings | Andronicus Enoch M. | Local and preview intentionally not provisioned; production-only workflow confirmed |
| Production secrets | Andronicus Enoch M. | Confirmed configured in the Cloudflare Dashboard secret store; local `.env.local` is ignored and contains no production secrets |
| DNS/TLS changes | Project owner + deployment administrator | Not in Phase 0; no changes authorised |

The current production-only workflow is an accepted interim arrangement for this implementation. It increases the risk of accidental public changes and makes isolated review harder; this must be addressed before client handover. Local environment files matching `.env.*` are ignored by Git, with `.env.example` reserved for non-secret variable names if needed. Production secrets are configured in the Cloudflare Dashboard, never committed to the repository or exposed in client code. Work-site provider and DNS settings are explicitly outside this register. When the build is complete, the repository will be transferred/cloned to the client GitHub, the client Cloudflare account will be associated, and a custom domain will be connected through a separately recorded handover checklist.

