# SSEGU Main Website Rework — Technical Specification

**Document:** `techspec.md`  
**Project:** SSEGU main-domain website rework  
**Status:** Revised scope / proposed architecture  
**Version:** 2.0  
**Date:** 7 November 2026

---

## 1. Project overview

### 1.1 Revised direction

The project is now focused exclusively on rebuilding the **main SSEGU website** at `https://ssegu.com/` and moving its source code, content workflow and deployment process to GitHub.

The existing `https://work.ssegu.com/` website is **not part of this development phase**. Its pages, features, content migration, visual redesign, routing and deployment are excluded from the current build.

The main website should retain its own established identity and editorial purpose. At the same time, the codebase must be organised so that a second, visually distinct section/template can be introduced later without requiring a major architectural rewrite. This is the future-facing provision referred to in this specification as the **dual-template provision**.

The dual-template provision is an architectural consideration only. It does not authorise or require the design or implementation of the Work section now.

### 1.2 Current project boundary

| Area | Current decision |
|---|---|
| Primary domain | `ssegu.com` |
| Current build | Main SSEGU website only |
| Existing Work site | Leave `work.ssegu.com` outside this project |
| Main-site design | Rework and implement the main-site experience |
| Future second template | Allow for it in code organisation and shared foundations |
| Work design and pages | Deferred; not to be designed or built now |
| Source control | GitHub |
| Frontend | Astro |
| Language | TypeScript |
| Styling | Tailwind CSS |
| CMS | Decap CMS |
| Hosting/deployment | Cloudflare Pages |
| Server-side features | Cloudflare Pages Functions only where required |
| Accounts | Deferred unless the main site has a confirmed requirement |
| Database | Avoid initially; introduce only for a demonstrated requirement |
| Media | Optimised repository assets initially; evaluate R2 later |

### 1.3 Goals

1. Rebuild the main SSEGU website on a maintainable, GitHub-backed codebase.
2. Preserve the main site's editorial identity while improving its structure, responsiveness, accessibility, performance and maintainability.
3. Provide a straightforward editorial workflow for creating and updating main-site content.
4. Deploy the main website through a repeatable GitHub-to-Cloudflare workflow.
5. Protect existing main-site URLs and search visibility during migration.
6. Keep the implementation simple and economical, favouring static generation and free/open-source tooling where practical.
7. Establish clean boundaries between the main-site template and shared foundations so a second template/section can be added later.

### 1.4 Explicitly out of scope

The following are not part of this release:

- Designing or rebuilding `work.ssegu.com`.
- Migrating Work content or job listings.
- Creating `/work/` pages, job boards, internship pages, career advice pages or employer-submission forms.
- Redirecting the Work subdomain into the main domain.
- Building employer dashboards, applicant accounts, job applications or recruitment workflows.
- Creating a second visual design system now.
- Implementing user accounts, comments, payments or complex personalisation without a separately approved requirement.

The existing Work website should continue to be managed independently until a future project explicitly brings it into scope. Do not change its DNS, hosting, content or redirects as part of this main-site rework.

---

## 2. Architecture

### 2.1 Recommended architecture

Build one Astro application for the main `ssegu.com` website, with a clear separation between:

- **Main-site presentation:** the layouts, components, styles and page structures used by the current build.
- **Shared foundations:** genuinely reusable utilities, accessibility primitives, metadata helpers and site-wide configuration.
- **Future template boundary:** a documented place to add a second, independent section/template later.

The future template boundary must not become an empty, over-engineered subsystem. For now, implement only what the main site needs and keep the separation straightforward.

```text
                         ssegu.com
                             |
                       Cloudflare Pages
                             |
                       One Astro app
                             |
                    Main-site experience
                             |
             +---------------+----------------+
             |                                |
       Main-site pages                 Shared foundations
       and components                  and utilities
             |                                |
             +---------------+----------------+
                             |
                       GitHub repository
                             |
                          Decap CMS
                             |
                    Editorial content commits
                             |
                      Cloudflare build
                             |
                       Live main website

              Future (not part of this release)
                             |
                Additional section/template
                with its own layout, styles,
                components and route namespace
```

### 2.2 Static-first delivery

Use Astro static generation for ordinary editorial pages wherever practical.

- Generate article and category pages at build time.
- Avoid server rendering a page if its content can be generated during the build.
- Add client-side JavaScript only for interactions that need it.
- Use Cloudflare Pages Functions only for confirmed server-side requirements.
- Do not introduce a database merely to store content that can remain in Git.

### 2.3 Why Astro

Astro is suitable for a content-led publication because it provides:

- Static-first delivery and low client-side JavaScript by default.
- File-based routing and layout composition.
- Content Collections for typed local content.
- Selective use of interactive UI frameworks where justified.
- A practical GitHub and Cloudflare deployment workflow.

### 2.4 Why Decap CMS

Decap CMS is the proposed Git-based editorial interface. Content is stored in the repository, allowing the site to remain portable and version-controlled.

Benefits include:

- No planned per-seat CMS subscription.
- Content stored in portable files.
- Git history for reviewing and restoring changes.
- Configurable collections for articles, authors, categories and static pages.
- A CMS interface served at `/admin/`.

The exact authentication arrangement must be prototyped before bulk content migration. A non-technical editor must be able to create, preview, edit and publish content without using Git commands.

---

## 3. Domain, routes and navigation

### 3.1 Current route scope

The current release owns routes on `https://ssegu.com/` for the main publication only.

The final route map must be based on an audit of the existing main-site Blogger URLs. The following is a starting point, not a replacement for that audit:

| Page type | Proposed route |
|---|---|
| Homepage | `/` |
| Latest news or listing | `/news/` |
| Category | `/category/{slug}/` |
| Article | `/{article-slug}/` or preserved legacy route |
| Search | `/search/` |
| About | `/about/` |
| Contact | `/contact/` |
| Privacy policy | `/privacy/` |
| Terms | `/terms/` |
| CMS administration | `/admin/` |

Existing URLs with established traffic or backlinks should be retained where feasible. Do not finalise article routing until the Blogger URL inventory and slug collisions have been reviewed.

### 3.2 Reserved future namespace

A future section may use a dedicated route namespace, such as `/work/`, if and when that project is approved. For now:

- Do not create Work pages or Work navigation.
- Do not create placeholder pages that imply the Work product is live.
- Do not redirect `work.ssegu.com`.
- Do not reserve route behaviour that interferes with existing main-site article slugs.
- Record the future namespace as a planning note and verify route ownership during the later Work project.

### 3.3 Main-site navigation

Design and implement navigation for the main SSEGU website only.

The main-site header and footer should reflect the publication's current content structure and approved design. Keep navigation data/configuration separate from presentation where doing so makes editorial maintenance easier.

Do not add a Work link unless the project owner explicitly requests it as a simple external link to the existing site. Such a link is a content/navigation decision, not a reason to build Work pages.

---

## 4. Repository structure

Proposed repository:

```text
ssegu/
├── public/
│   ├── admin/
│   │   ├── index.html
│   │   └── config.yml
│   ├── uploads/
│   ├── favicon.svg
│   └── robots.txt
│
├── src/
│   ├── components/
│   │   ├── main/
│   │   ├── shared/
│   │   └── ui/
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── MainLayout.astro
│   │
│   ├── pages/
│   │   ├── index.astro
│   │   ├── news/
│   │   ├── category/
│   │   ├── about.astro
│   │   ├── contact.astro
│   │   ├── privacy.astro
│   │   ├── terms.astro
│   │   ├── search.astro
│   │   ├── rss.xml.ts
│   │   └── sitemap-index.xml.ts
│   │
│   ├── content/
│   │   ├── articles/
│   │   ├── categories/
│   │   ├── authors/
│   │   └── pages/
│   │
│   ├── styles/
│   │   ├── global.css
│   │   └── main.css
│   │
│   ├── lib/
│   │   ├── content/
│   │   ├── seo/
│   │   ├── search/
│   │   └── validation/
│   │
│   └── content.config.ts
│
├── functions/                 # Only if server-side features are needed
├── scripts/
│   ├── blogger-export/
│   ├── migrate-content/
│   ├── validate-redirects/
│   └── audit-content/
│
├── docs/
│   ├── migration-map.csv
│   ├── content-model.md
│   ├── deployment.md
│   └── future-template-notes.md
│
├── astro.config.mjs
├── wrangler.toml
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

### 4.1 Organisation rules

- Keep current main-site components in `components/main/`.
- Put components in `shared/` only when they are genuinely reusable.
- Keep the main-site layout and styles self-contained.
- Keep content queries and transformations outside presentation components.
- Keep migration scripts separate from runtime application code.
- Use TypeScript and schema validation for application and content data.
- Never expose secrets in client-side code or committed configuration.
- Avoid creating a `work/` component tree, Work content collections or Work routes in this release.

### 4.2 Future dual-template provision

When a second section is approved, it should be possible to add a separate layout and component namespace without rewriting the main site. A possible future structure is:

```text
src/
├── components/
│   ├── main/
│   ├── work/       # Add only in the future Work project
│   ├── shared/
│   └── ui/
├── layouts/
│   ├── BaseLayout.astro
│   ├── MainLayout.astro
│   └── WorkLayout.astro  # Add only when approved
└── styles/
    ├── global.css
    ├── main.css
    └── work.css          # Add only when approved
```

This is a design constraint, not a requirement to create empty directories or files now. The future section should be able to own its own header, footer, navigation, typography, colour tokens, page composition and interaction patterns. Shared code should remain limited to genuinely generic utilities and primitives.

---

## 5. Main-site content model

Decap CMS will manage structured content in GitHub. Astro Content Collections will validate and consume that content. CMS fields and Astro schemas must agree on names, types and required values.

### 5.1 Article

Suggested fields:

| Field | Type | Notes |
|---|---|---|
| Title | String | Required |
| Slug | String | Required and unique |
| Excerpt | Text | Short summary |
| Body | Markdown/rich text | Main article |
| Featured image | Image | Optimised image |
| Image caption | String | Optional |
| Image credit | String | Optional |
| Author | Relation/reference | Required where applicable |
| Categories | Relation/list | One or more |
| Tags | List | Optional |
| Published date | Date/time | Required |
| Updated date | Date/time | Optional |
| Featured | Boolean | Homepage/editorial selection |
| SEO title | String | Optional override |
| Meta description | Text | Optional override |
| Canonical URL | String | Only when needed |
| Draft | Workflow/status | Managed through editorial process |

### 5.2 Category

- Name.
- Slug.
- Description.
- Optional image.
- Navigation visibility.
- Display order.

### 5.3 Author

- Name.
- Slug.
- Biography.
- Portrait.
- Social/profile links.

### 5.4 Static pages and site configuration

Potential content/configuration documents:

- Site settings.
- Main navigation settings.
- Homepage configuration.
- Static pages.
- Advertisement/sponsored placements.
- Redirect records.

Keep advertisement placement configurable and clearly label sponsored content.

### 5.5 Content portability

Use Markdown for long-form content wherever practical. Store images as files and reference them using relative paths or stable URLs. Avoid proprietary formats that make future migration unnecessarily difficult.

Do not add job, internship, course or employer collections in this release. They belong to the deferred Work project unless a distinct main-site editorial requirement is confirmed.

---

## 6. Decap CMS and editorial workflow

### 6.1 CMS location

The CMS interface will be served from:

`https://ssegu.com/admin/`

The CMS must not appear in public navigation or search indexing.

### 6.2 Authentication

Use Decap's supported GitHub backend with a correctly configured authentication flow.

Implementation requirements:

1. Create a dedicated GitHub OAuth application for SSEGU, if required by the selected backend arrangement.
2. Configure the correct production and local callback URLs.
3. Implement or deploy a compatible OAuth callback/proxy using Cloudflare Workers or Pages Functions if required.
4. Store client secrets as Cloudflare secrets, never in the repository.
5. Test login, logout, token handling and callback errors.
6. Restrict repository collaborator access to approved staff.
7. Document how editors are added and removed.

Do not assume the GitHub backend works without an OAuth callback service. Verify the selected Decap version's current authentication requirements before implementation.

### 6.3 Editorial workflow

Enable Decap editorial workflow if review before publication is required.

Recommended process:

1. Author creates a draft.
2. Draft is saved to a branch.
3. Editor reviews the preview.
4. Editor approves and merges the change.
5. GitHub receives the merge.
6. Cloudflare builds and deploys the updated site.

Test the exact branch and pull-request behaviour with the chosen GitHub backend and Cloudflare integration. If there is only one trusted publisher, direct publishing may be simpler initially.

### 6.4 Editor acceptance test

Before bulk migration, a non-developer editor must successfully:

- Log in.
- Create an article.
- Add a title, excerpt, body and image.
- Select an author and category.
- Preview the article.
- Save a draft.
- Edit an existing article.
- Publish an article.
- Correct a mistake and restore an earlier version where appropriate.

If this workflow is frustrating or unreliable, resolve it before migrating the archive.

---

## 7. Search and discovery

### 7.1 Initial search

Generate a compact search index at build time. It may contain:

- Article title.
- Excerpt.
- Category.
- Publication date.
- URL.
- Content type.
- Selected searchable text.

Use a lightweight client-side search library or a small custom implementation. Do not load entire article bodies into the browser search index.

### 7.2 Future search

Introduce a dedicated search service only if content volume and search requirements justify it. Do not add a paid hosted search dependency to the initial release.

---

## 8. Media and image strategy

### 8.1 Initial media storage

Images may initially be stored in the repository under `public/uploads/` and committed through Decap.

Requirements:

- Resize and compress images before upload.
- Prefer WebP or AVIF where suitable, with sensible fallbacks where needed.
- Use descriptive filenames.
- Provide useful alt text.
- Preserve captions and credits.
- Generate responsive image sizes where practical.
- Avoid committing original multi-megabyte camera files.
- Establish a maximum upload size and editorial image guidance.

Git-based media storage is simple but not ideal for an indefinitely growing archive. Monitor repository size.

### 8.2 Future R2 migration

Cloudflare R2 may be introduced when media volume makes Git storage inconvenient. R2 is not automatically a Decap media library; a custom upload integration or alternative editorial workflow would be required.

Do not add R2 until its operational benefit outweighs the integration work.

---

## 9. GitHub and Cloudflare deployment

### 9.1 Source control

GitHub is the source of truth for:

- Astro application code.
- Tailwind configuration and styles.
- Decap CMS configuration.
- Main-site content files.
- Migration and validation scripts.
- Redirect mapping.
- Technical documentation.

Use a clear branch strategy. At minimum, protect the production branch and use pull requests or an equivalent review process for significant code changes.

### 9.2 Deployment flow

1. Developer or editor pushes/merges a change to GitHub.
2. Cloudflare Pages detects the relevant commit.
3. Astro builds the site.
4. Cloudflare deploys the generated output.
5. Preview deployments are used to review pull requests before production where practical.

### 9.3 Build configuration

Confirm exact commands against the selected Astro setup. A typical static build is:

```bash
npm ci
npm run build
```

Typical output directory:

```text
dist/
```

Do not add a server adapter merely because the project uses Cloudflare. A static Astro site can be deployed as static assets. Add the Cloudflare adapter or Functions only when a confirmed server-side feature requires it.

### 9.4 Functions

No custom server-side endpoint is assumed for the main-site launch. Add Cloudflare Pages Functions only for an approved feature that cannot reasonably be implemented statically.

### 9.5 Cost and quota controls

The project aims to avoid recurring software and hosting subscriptions by using free plans and open-source tools where practical. This is not a guarantee of unlimited usage or permanent free service. Domain renewal, optional email delivery, later paid services and changes to provider policies are outside that aim.

Before launch:

- Verify current provider limits and pricing.
- Monitor build usage.
- Optimise image size.
- Avoid unnecessary builds.
- Keep any Functions narrow and inexpensive.
- Maintain repository backups.
- Avoid dependencies on a free allowance close to its limit.

---

## 10. Main-site content migration and SEO

SEO preservation is a critical requirement for the main-site migration.

### 10.1 Pre-migration audit

Audit the **main Blogger site only** for:

- Published posts and pages.
- Original URLs and slugs.
- Publication and updated dates.
- Titles and descriptions.
- Labels/categories.
- Authors.
- Images and embeds.
- Canonical tags, where present.
- Search Console clicks, impressions and indexed URLs.
- Existing redirects.

Export the main Blogger site. Supplement the export with a media audit because an export does not guarantee that all original image files are locally available.

The Work subdomain and its content are not migration inputs for this release.

### 10.2 Migration utility

Create a repeatable migration script that:

1. Parses the main Blogger XML/Atom export.
2. Extracts posts and pages.
3. Records original URLs.
4. Maps labels to main-site categories.
5. Preserves dates and authors where possible.
6. Downloads or reconciles media assets.
7. Converts article HTML to the chosen Markdown/content representation.
8. Flags unsupported or suspicious markup.
9. Creates content files in the repository.
10. Produces a migration report.

Do not assume automated HTML conversion will preserve every table, embed, caption or unusual layout. Flag exceptions for manual review.

### 10.3 Redirect mapping

Create a CSV with at least:

```text
old_url,new_url,redirect_type,verified
```

Rules:

- Map old main-site articles to their exact new articles.
- Preserve existing URLs where practical.
- Use permanent redirects for pages that have moved permanently.
- Avoid redirecting unrelated or missing pages to the homepage.
- Preserve useful query parameters.
- Check for redirect loops.
- Return 404 or 410 where no meaningful replacement exists.

Do not create or change redirects for `work.ssegu.com` in this project.

### 10.4 SEO implementation

Implement:

- Unique title and meta description.
- Canonical URLs.
- XML sitemap.
- Robots.txt.
- Open Graph and social metadata.
- Article structured data.
- Breadcrumb structured data where appropriate.
- RSS feed.
- Correct pagination metadata where applicable.
- Proper 404 pages.
- Search Console verification.

### 10.5 Launch monitoring

After launch:

- Submit the new sitemap in Google Search Console.
- Monitor indexed pages and crawl errors.
- Monitor 404s and redirect failures.
- Compare search performance with the pre-migration baseline.
- Fix incorrect canonical URLs.
- Keep main-site redirects active.

---

## 11. Security and operations

### 11.1 Secrets

Never commit:

- GitHub OAuth client secrets.
- Cloudflare API tokens.
- Private service tokens.
- Email provider API keys, if email is later introduced.

Use Cloudflare environment secrets and local environment files excluded by `.gitignore`.

### 11.2 CMS security

- Require authentication for `/admin/`.
- Limit GitHub repository access to approved editors and developers.
- Remove access promptly when a contributor leaves.
- Do not share administrator accounts.
- Use branch protection and pull-request review where practical.
- Keep dependencies updated.
- Protect production secrets from preview deployments.

### 11.3 Backups

GitHub version history is useful but should not be the only backup. Maintain periodic backups of:

- Source code.
- Main-site content files.
- Media assets.
- CMS configuration.
- Redirect map.
- Deployment documentation.

Test that a backup can actually be restored.

---

## 12. Performance and accessibility

### 12.1 Performance goals

Design for low-bandwidth mobile access as well as desktop.

Requirements:

- Static HTML for ordinary content pages.
- Optimised responsive images.
- Lazy loading for below-the-fold images.
- Avoid unnecessary client-side JavaScript.
- Use modern font formats and sensible font loading.
- Avoid large third-party scripts.
- Cache static assets effectively.
- Prevent layout shifts by specifying image dimensions.
- Keep homepage modules efficient.

Targets are project goals, not guarantees:

| Metric | Target |
|---|---:|
| Lighthouse Performance | 90+ on representative pages |
| Lighthouse Accessibility | 95+ |
| Lighthouse SEO | 95+ |
| Largest Contentful Paint | Under 2.5 seconds |
| Cumulative Layout Shift | Under 0.1 |
| Interaction to Next Paint | Under 200 ms |

Measure representative mobile pages under realistic network conditions.

### 12.2 Accessibility

- Semantic HTML.
- Keyboard-operable navigation.
- Visible focus states.
- Correct heading hierarchy.
- Useful alt text.
- Sufficient colour contrast.
- Labels and error messages for forms.
- No colour-only status indicators.
- Respect reduced-motion preferences.

---

## 13. Testing and acceptance criteria

### 13.1 Design and routing

- [ ] `/` displays the main SSEGU experience.
- [ ] Main-site pages follow the approved visual system.
- [ ] Header, navigation and footer work across the main-site routes.
- [ ] All defined routes resolve correctly.
- [ ] Mobile and desktop layouts work.
- [ ] No route collisions exist.
- [ ] No unfinished Work pages or Work template are included.
- [ ] The code structure leaves a clear path for a future independent template.

### 13.2 CMS

- [ ] Editor can log in without developer intervention.
- [ ] Editor can create, edit, preview and publish a news article.
- [ ] Editor can manage categories and authors.
- [ ] Drafts do not appear publicly.
- [ ] Images upload and display correctly.
- [ ] Editorial workflow behaves as documented.
- [ ] A non-technical editor passes the usability test.

### 13.3 Migration and SEO

- [ ] Main Blogger export has been audited.
- [ ] All important main-site URLs are accounted for.
- [ ] Redirects point to relevant destinations.
- [ ] No redirect loops exist.
- [ ] Article dates and authors are preserved where available.
- [ ] Images and embeds have been reviewed.
- [ ] Canonical URLs are correct.
- [ ] Sitemap validates.
- [ ] Structured data validates.
- [ ] 404 pages behave correctly.
- [ ] Search Console baseline and post-launch monitoring are in place.
- [ ] No Work-site migration or redirect changes have been made.

### 13.4 Operations

- [ ] Production deployment works from GitHub.
- [ ] Preview deployment works.
- [ ] Secrets are not present in the repository.
- [ ] Repository backup is available and restorable.
- [ ] Rollback procedure is documented.
- [ ] Provider quotas have been checked.

---

## 14. Implementation phases

### Phase 1 — Discovery and audit

Deliverables:

- Export the main Blogger site.
- Main-site content and media inventory.
- Main-site URL and redirect spreadsheet.
- Search Console baseline.
- Confirmed main-site route map.
- List of special content, embeds and formatting exceptions.
- Review of the existing main-site design and required templates.

**Exit condition:** Main-site content, URL and design requirements are sufficiently understood to begin implementation.

### Phase 2 — Foundation

Deliverables:

- GitHub repository.
- Astro application.
- TypeScript and Tailwind.
- Cloudflare Pages deployment.
- Preview deployment.
- Main-site layout foundation.
- Shared utilities where genuinely needed.
- Future dual-template boundary documented.
- Environment and secrets documentation.

**Exit condition:** The main-site foundation deploys successfully from GitHub.

### Phase 3 — Main-site design and frontend

Deliverables:

- Main-site homepage.
- News/category listing pages.
- Article detail pages.
- Required static pages.
- Responsive header, navigation and footer.
- Search interface, if included in the approved main-site requirements.
- Sample content for visual and functional review.

**Exit condition:** The main-site experience is functionally navigable and matches the approved design direction.

### Phase 4 — CMS

Deliverables:

- Decap configuration.
- GitHub authentication setup.
- Article, category, author and static-page collections.
- Editorial workflow.
- Image handling.
- Editor usability test.

**Exit condition:** A non-developer can reliably publish and update main-site content.

### Phase 5 — Migration

Deliverables:

- Blogger import utility.
- Migrated main-site content.
- Reconciled images.
- Reviewed formatting.
- Redirect map.
- Migration report.

**Exit condition:** Important main-site content and URLs have been verified.

### Phase 6 — Quality assurance and launch

Deliverables:

- Mobile and desktop testing.
- Performance and accessibility checks.
- SEO validation.
- Redirect testing.
- Production DNS/configuration cutover for the main site.
- Search Console submission.
- Rollback plan.

**Exit condition:** Production acceptance checklist is complete.

### Deferred phase — Work section / second template

This is a separate future project and is not included in the current delivery estimate or acceptance criteria.

When authorised, that project may:

- Assess the existing `work.ssegu.com` website and its content.
- Decide whether to migrate it to a path such as `ssegu.com/work/`.
- Design a distinct Work visual identity and template.
- Add Work-specific routes, components, styles and content models.
- Plan and test redirects from the old Work URLs.
- Add any employment-specific features that are separately approved.

No Work implementation should begin merely because the current codebase has been prepared to accommodate a second template.

---

## 15. Future expansion

The architecture should leave room for future additions without implementing them now.

| Future capability | Possible approach |
|---|---|
| Second visual section/template | Independent layout, components, styles and route namespace |
| Work section migration | Separate discovery, design, content migration and redirect project |
| User accounts | Supabase Auth or another suitable identity provider |
| Advanced search | Dedicated search index/service if justified |
| Larger media library | Cloudflare R2 with a suitable editorial upload workflow |
| Editorial analytics | Privacy-conscious analytics |
| Notifications | Transactional email provider, after checking current terms |

When transactional user data is eventually introduced, keep it separate from Git-based editorial content. Do not turn GitHub into an application database.

---

## 16. Key risks and mitigations

| Risk | Mitigation |
|---|---|
| Scope expands back into Work prematurely | Keep Work design, migration and features explicitly deferred; require a separate approval |
| Editors struggle with GitHub-based CMS | Test with a non-technical editor before migration |
| OAuth setup is unreliable | Prototype authentication early |
| Repository becomes too large | Compress images and monitor media storage |
| Blogger formatting converts poorly | Produce a migration report and manually review exceptions |
| Search rankings decline | Preserve main-site URLs and implement verified redirects |
| Free-tier quotas change | Monitor usage and maintain provider-independent backups |
| Too much abstraction is introduced for a future template | Build only current requirements; document extension points rather than creating empty subsystems |

---

## 17. Technical decision record

| Area | Current decision |
|---|---|
| Project scope | Main SSEGU website only |
| Primary domain | `ssegu.com` |
| Existing Work site | Outside current scope; leave unchanged |
| Future second template | Provide for it architecturally; do not implement now |
| Architecture | One Astro application for the main site |
| Language | TypeScript |
| Styling | Tailwind CSS |
| CMS | Decap CMS |
| Content storage | GitHub repository |
| Hosting | Cloudflare Pages |
| Server-side endpoints | Cloudflare Pages Functions only if required |
| CMS authentication | GitHub backend with compatible authentication flow |
| Initial media storage | Optimised repository assets |
| Future media storage | Cloudflare R2, if justified |
| Search | Build-time static index, if required |
| User accounts | Deferred |
| Work routes and pages | Deferred |
| Work migration and redirects | Deferred |
| Paid subscriptions | None planned |

### Non-negotiable project principles

1. The current build is the main SSEGU website only.
2. Do not design or implement the Work section in this phase.
3. Keep a clean architectural path for a future independent template.
4. The main website should be static-first.
5. Content must remain portable and backed up.
6. Existing main-site URLs and search visibility are migration assets.
7. Do not introduce a paid dependency without explicit approval.
8. Free-tier limits must be verified and monitored.
9. Do not build future account or recruitment functionality before it is needed.
10. Editorial usability must be proven before bulk migration.
11. Do not modify the existing Work website, its DNS or its redirects as part of this project.

---

## 18. Official technical references

Check current documentation before implementation, especially where provider plans and integration behaviour can change.

- Astro: https://docs.astro.build/
- Astro Cloudflare deployment: https://docs.astro.build/en/guides/deploy/cloudflare/
- Decap CMS: https://decapcms.org/docs/intro/
- Decap GitHub backend: https://decapcms.org/docs/backends-overview/
- Decap editorial workflow: https://decapcms.org/docs/editorial-workflows/
- Decap configuration: https://decapcms.org/docs/configuration-options/
- Cloudflare Pages: https://developers.cloudflare.com/pages/
- Cloudflare Pages Functions: https://developers.cloudflare.com/pages/functions/
- Cloudflare R2: https://developers.cloudflare.com/r2/
- GitHub documentation: https://docs.github.com/
- Blogger Help: https://support.google.com/blogger/

---

**Document status:** This specification records the revised project scope and proposed implementation direction. It is not a claim that the production system has already been built or tested. Exact provider quotas, authentication integration details, deployment configuration, final design decisions and migration mappings must be verified during implementation.
