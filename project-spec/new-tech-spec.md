# SSEGU Website Consolidation --- Technical Specification

**Document:** `techspec.md`\
**Project:** SSEGU --- consolidated news publication and employment
portal\
**Status:** Proposed architecture\
**Version:** 1.0\
**Date:** 6 November 2026

------------------------------------------------------------------------

## 1. Project overview

SSEGU currently operates two websites:

-   `https://ssegu.com/` --- the main publication.
-   `https://work.ssegu.com/` --- the employment and opportunities
    section.

The project will consolidate both into one website under the primary
domain:

-   `https://ssegu.com/` --- news publication.
-   `https://ssegu.com/work/` --- employment and opportunities portal.

The two sections must look and behave like distinct products while
sharing one domain, repository, deployment pipeline and
content-management approach.

The project is intended to operate with **no recurring software or
hosting subscription costs**. It will use free plans and open-source
software, subject to their published quotas and terms. Domain renewal,
optional email delivery, paid services introduced later, and costs
resulting from changed provider policies are outside this guarantee.

### 1.1 Confirmed requirements

  -----------------------------------------------------------------------
  Requirement                         Decision
  ----------------------------------- -----------------------------------
  Main site                           News publication

  Employment section                  Editorial employment portal

  URL structure                       Main domain with `/work/` path

  Visual design                       Two substantially different layouts

  CMS                                 Decap CMS

  Frontend                            Astro

  Styling                             Tailwind CSS

  Source control                      GitHub

  Hosting                             Cloudflare Pages

  Server-side features                Cloudflare Pages Functions /
                                      Workers

  Accounts                            Deferred

  Job listings                        Manual editorial publishing and
                                      employer submissions

  Database                            Introduce only where required;
                                      Cloudflare D1 for submissions if
                                      needed

  Media                               Repository assets initially;
                                      evaluate R2 when appropriate

  Migration source                    Section-specific: current News
                                      fixtures plus pinned Work GitHub
                                      `posts/` dataset
  -----------------------------------------------------------------------

### 1.2 Project goals

1.  Consolidate both websites without unnecessarily losing existing
    search visibility.
2.  Deliver a credible, fast, mobile-friendly news publication.
3.  Give SSEGU Work an independent employment-focused experience.
4.  Provide a manageable editorial interface for non-developer
    publishers.
5.  Support manually created job listings and employer-submitted
    vacancies.
6.  Keep the initial system simple enough to operate within free-tier
    limits.
7.  Leave a clear route to add user accounts and more advanced
    employment features later.

### 1.3 Out of scope for the initial release

-   Applicant accounts and profiles.
-   Employer dashboards and self-service job management.
-   Online applications and CV uploads.
-   Applicant tracking systems.
-   Paid job listings, subscriptions or payment processing.
-   Comments and community features.
-   Complex personalisation or recommendation systems.
-   A custom, general-purpose CMS.
-   A separate frontend application or subdomain for Work.

These may be considered in later phases after the publication is
operating successfully.

------------------------------------------------------------------------

## 2. Recommended architecture

### 2.1 Architecture summary

Use one Astro application with two independent page shells:

-   **News shell:** editorial newspaper/magazine design.
-   **Work shell:** employment portal design.

Both sections read content from the same GitHub repository. Decap CMS
provides the editorial interface and commits content changes to GitHub.
Cloudflare Pages builds and deploys the site when relevant commits are
pushed.

Cloudflare Pages Functions provide narrowly scoped server-side
functionality, such as employer-submission handling and, if required by
the selected Decap authentication configuration, an OAuth callback.

``` text
                         ssegu.com
                             |
                       Cloudflare Pages
                             |
                    One Astro application
                             |
                 +-----------+-----------+
                 |                       |
             NEWS SECTION            WORK SECTION
                 |                       |
            / and /news/              /work/
            /categories/              /work/jobs/
            /articles/                /work/career-advice/
                 |                       |
                 +-----------+-----------+
                             |
                     GitHub repository
                             |
                         Decap CMS
                             |
                  Editorial publishing workflow
                             |
                     Git commits / PRs
                             |
                     Cloudflare build
                             |
                       Live website

Employer submission form
          |
Cloudflare Pages Function
          |
Validation + Turnstile + rate limiting
          |
Cloudflare D1 (pending submissions)
          |
Manual editorial review
          |
Editor creates and publishes approved job in Decap
```

### 2.2 Why Astro

Astro is recommended because the majority of the website is editorial
content that can be generated as static HTML.

Benefits:

-   Static-first delivery and low client-side JavaScript by default.
-   Strong support for content-heavy sites.
-   File-based routing and layouts.
-   Content Collections for typed local content.
-   React or other UI components can be added selectively.
-   Straightforward Cloudflare Pages deployment.
-   No need to run a server for ordinary article views.

Use static generation for articles, categories, job pages and other
public content wherever practical. Do not make every page a
server-rendered request merely to retrieve content that changes
infrequently.

### 2.3 Why Decap CMS

Decap is an open-source, Git-based CMS. Content is stored as files in
the repository rather than in a separate paid CMS database.

Benefits:

-   No per-seat CMS subscription.
-   Content remains in a portable format.
-   Git history provides a record of changes.
-   Custom collections can represent news, jobs, courses and other
    content.
-   Editorial workflow can use branches and pull requests.
-   The CMS can be hosted at `/admin/`.

Trade-offs:

-   Editors need GitHub accounts and appropriate repository access.
-   Authentication requires correct GitHub OAuth configuration.
-   Git-based media storage can make a repository large if images are
    not managed carefully.
-   The editing experience is less turnkey than a hosted headless CMS.
-   GitHub permissions are broader than purpose-built CMS editorial
    roles; repository access must be managed carefully.

**Editorial usability is a launch requirement.** A non-technical editor
must be able to create, preview, edit and publish an article without
using Git commands.

------------------------------------------------------------------------

## 3. Domain and route architecture

### 3.1 URL structure

The following is the proposed URL map. Existing URLs with established
traffic or backlinks should be retained where feasible; the final route
map must be reconciled against the Blogger URL inventory before
implementation.

  Page                 Proposed URL
  -------------------- ----------------------------------------------
  News homepage        `/`
  Latest news          `/news/`
  News category        `/category/{slug}/`
  News article         `/{article-slug}/` or preserved legacy route
  Search               `/search/`
  About                `/about/`
  Contact              `/contact/`
  Work homepage        `/work/`
  All jobs             `/work/jobs/`
  Job detail           `/work/jobs/{slug}/`
  Internships          `/work/internships/`
  Career advice        `/work/career-advice/`
  Courses              `/work/courses/`
  CV resources         `/work/cv-resources/`
  Submit a job         `/work/submit-job/`
  Privacy policy       `/privacy/`
  Terms                `/terms/`
  CMS administration   `/admin/`

Avoid ambiguous dynamic routes that could cause a news slug to conflict
with a Work route. Define route ownership explicitly.

### 3.2 Navigation

The news header should include a clearly visible Work destination.

The Work header should have its own navigation and a clear route back to
SSEGU News.

The two sections should have independent:

-   Headers and navigation.
-   Footers.
-   Typography and visual hierarchy.
-   Colour tokens and component styling.
-   Homepage structures.
-   Search and filtering interfaces where appropriate.

Shared elements may include the logo, basic accessibility utilities,
social links, cookie/privacy messaging and selected generic UI
primitives. Do not force the two designs into one generic template.

### 3.3 Redirect source domains

After migration:

-   `work.ssegu.com` must remain configured as a redirect source.
-   Redirect old Work URLs to their corresponding new `/work/`
    destinations.
-   Redirect old main-site URLs to their new destinations.
-   Preserve query strings when they are meaningful.
-   Do not redirect every missing URL to the homepage.
-   Return a genuine 404 for URLs with no suitable replacement.

Keep the old subdomain's DNS and HTTPS configuration working for as long
as redirects are required.

------------------------------------------------------------------------

## 4. Repository structure

Proposed repository:

``` text
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
│   │   ├── news/
│   │   ├── work/
│   │   ├── shared/
│   │   └── ui/
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── NewsLayout.astro
│   │   └── WorkLayout.astro
│   │
│   ├── pages/
│   │   ├── index.astro
│   │   ├── news/
│   │   ├── category/
│   │   ├── work/
│   │   ├── about.astro
│   │   ├── contact.astro
│   │   ├── privacy.astro
│   │   ├── terms.astro
│   │   ├── rss.xml.ts
│   │   └── sitemap-index.xml.ts
│   │
│   ├── content/
│   │   ├── articles/
│   │   ├── work-articles/
│   │   ├── jobs/
│   │   ├── internships/
│   │   ├── courses/
│   │   ├── categories/
│   │   └── authors/
│   │
│   ├── styles/
│   │   ├── global.css
│   │   ├── news.css
│   │   └── work.css
│   │
│   ├── lib/
│   │   ├── content/
│   │   ├── seo/
│   │   ├── search/
│   │   └── validation/
│   │
│   └── content.config.ts
│
├── functions/
│   └── api/
│       ├── job-submissions.ts
│       └── oauth/
│           └── callback.ts
│
├── scripts/
│   ├── blogger-export/
│   ├── migrate-content/
│   ├── validate-redirects/
│   └── audit-content/
│
├── migrations/
│   └── d1/
│
├── docs/
│   ├── migration-map.csv
│   ├── content-model.md
│   └── deployment.md
│
├── astro.config.mjs
├── wrangler.toml
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

The exact Astro routing and content configuration should be finalised
during the project foundation phase. Do not create empty abstractions or
a complicated monorepo without a concrete need.

### 4.1 Code organisation rules

-   Keep News and Work components in separate directories.
-   Keep their layout and design tokens independent.
-   Put shared components in `shared/` only when they genuinely serve
    both sections.
-   Keep content queries and transformations outside presentation
    components.
-   Validate external form data on the server.
-   Never expose secrets in client-side code or committed configuration.
-   Keep migration scripts separate from runtime application code.
-   Use TypeScript for application code and schema validation.

------------------------------------------------------------------------

## 5. Content model

Decap CMS will manage structured Markdown/JSON content in GitHub. Astro
Content Collections will validate and consume that content.

The CMS collections and Astro schemas must agree on field names, types
and required values.

### 5.1 News collections

#### Article

Suggested fields:

  Field              Type                   Notes
  ------------------ ---------------------- -----------------------------------
  Title              String                 Required
  Slug               String                 Required, unique
  Excerpt            Text                   Short summary
  Body               Markdown / rich text   Main article
  Featured image     Image                  Optimised image
  Image caption      String                 Optional
  Image credit       String                 Optional
  Author             Relation/reference     Required where applicable
  Categories         Relation/list          One or more
  Tags               List                   Optional
  Published date     Date/time              Required
  Updated date       Date/time              Optional
  Featured           Boolean                Homepage/editorial selection
  SEO title          String                 Optional override
  Meta description   Text                   Optional override
  Canonical URL      String                 Only when needed
  Draft              Boolean/workflow       Managed through editorial process

#### Category

-   Name.
-   Slug.
-   Description.
-   Optional image.
-   Navigation visibility.
-   Display order.

#### Author

-   Name.
-   Slug.
-   Biography.
-   Portrait.
-   Social/profile links.

### 5.2 Work collections

#### Job

  -----------------------------------------------------------------------
  Field                   Type                    Notes
  ----------------------- ----------------------- -----------------------
  Job title               String                  Required

  Slug                    String                  Required, unique

  Employer                String/reference        Required

  Employer logo           Image                   Optional

  Location                String                  Required

  Work arrangement        Enum                    On-site, hybrid, remote

  Employment type         Enum                    Full-time, part-time,
                                                  contract, internship,
                                                  etc.

  Salary                  String                  Optional; never invent

  Description             Markdown                Required

  Requirements            Markdown/list           Optional

  Qualifications          Markdown/list           Optional

  Application method      Enum                    External URL, email,
                                                  instructions

  Application URL         URL                     Conditional

  Application email       Email                   Conditional

  Application             Text                    Conditional
  instructions                                    

  Deadline                Date/time               Required where supplied

  Source URL              URL                     Recommended

  Verification note       String                  Internal/editorial

  Published date          Date/time               Required

  Status                  Enum                    Draft, published,
                                                  expired

  Featured                Boolean                 Optional

  SEO fields              Object                  Optional
  -----------------------------------------------------------------------

Do not publish a vacancy unless its source and application instructions
have been reviewed. Do not invent salary, employer details, deadlines or
eligibility requirements.

#### Internship

Use a distinct document type if internships require different fields,
eligibility details or presentation. Otherwise, a shared opportunity
model with a clear opportunity type may be considered after examining
the existing content.

#### Work Article

For career advice, CV guidance, employment information and tutorials.

Fields should broadly mirror the News Article model but use a separate
collection and Work-specific categories.

#### Course

-   Course name.
-   Provider.
-   Description.
-   Delivery mode.
-   Duration.
-   Eligibility.
-   Cost, if verified.
-   Enrolment URL.
-   Application deadline, if applicable.
-   Source.
-   Publication/update dates.

#### Employer

Initially, employer profiles may be editorial documents rather than
user-managed accounts.

-   Organisation name.
-   Slug.
-   Logo.
-   Website.
-   Description.
-   Location.
-   Verification/source notes.

### 5.3 Shared content and configuration

Potential shared collections:

-   Site settings.
-   Navigation settings.
-   Homepage configuration.
-   Advertisements/sponsored placements.
-   Redirect records.
-   Static pages.

Keep ad placement configurable, but ensure sponsored content is clearly
labelled.

### 5.4 Content portability

Use Markdown for long-form content wherever practical. Store images as
files and reference them using relative paths or stable URLs.

Avoid proprietary content formats that make future migration
unnecessarily difficult.

------------------------------------------------------------------------

## 6. Decap CMS configuration and editorial workflow

### 6.1 CMS location

The CMS interface will be served from:

`https://ssegu.com/admin/`

The public website and CMS share the same deployment, but `/admin/` must
not be included in public navigation or search indexing.

### 6.2 Authentication

Use Decap's supported GitHub backend with a correctly configured OAuth
flow.

Implementation requirements:

1.  Create a dedicated GitHub OAuth application for SSEGU.
2.  Configure the correct production and local callback URLs.
3.  Implement or deploy a compatible OAuth proxy/callback using
    Cloudflare Workers or Pages Functions.
4.  Store the GitHub client secret as a Cloudflare secret, never in the
    repository.
5.  Test login, logout, token handling and callback errors.
6.  Restrict repository collaborator access to approved staff.
7.  Document how editors are added and removed.

Do not assume that a GitHub backend configuration works without an OAuth
callback service. Verify the selected Decap version's authentication
requirements before implementation.

### 6.3 Editorial workflow

Enable Decap editorial workflow if the publishing process requires
review before changes reach the live site.

Recommended workflow:

1.  Author creates a draft.
2.  Draft is saved to a branch.
3.  Editor reviews the preview.
4.  Editor approves and merges the change.
5.  GitHub receives the merge.
6.  Cloudflare builds and deploys the updated site.

Test the exact branch and pull-request behaviour with the chosen GitHub
backend and Cloudflare integration.

If the client has only one trusted publisher, direct publishing may be
simpler initially. Do not enable a complicated approval process without
an editorial need.

### 6.4 Editor usability acceptance test

Before content migration, a non-developer editor must successfully:

-   Log in.
-   Create an article.
-   Add a title, excerpt, body and image.
-   Select an author and category.
-   Preview the article.
-   Save a draft.
-   Edit an existing article.
-   Publish an article.
-   Create a job listing.
-   Correct a mistake and restore an earlier version where appropriate.

If this test is frustrating or unreliable, resolve the CMS workflow
before migrating the archive.

------------------------------------------------------------------------

## 7. Employer job submissions

The first release supports two sources of job content:

1.  Jobs entered manually by SSEGU editors in Decap.
2.  Jobs submitted by employers through a public form and reviewed by
    SSEGU editors.

### 7.1 Submission workflow

``` text
Employer opens /work/submit-job/
              |
         Completes form
              |
       Server-side validation
              |
       Turnstile verification
              |
        Rate-limit checks
              |
     Save pending submission
              |
       Notify/review process
              |
       Editor verifies details
              |
       Editor creates Job in Decap
              |
          Publish job
```

### 7.2 Form fields

Required:

-   Organisation name.
-   Contact person's name.
-   Contact email.
-   Job title.
-   Job description.
-   Location.
-   Employment type.
-   Application deadline.
-   Application instructions or application URL.

Optional:

-   Salary.
-   Organisation website.
-   Logo.
-   Additional supporting information.

### 7.3 Initial implementation

Use a Cloudflare Pages Function to:

-   Validate input with a server-side schema.
-   Verify Turnstile tokens.
-   Apply rate limiting and basic abuse prevention.
-   Reject malformed or excessively large submissions.
-   Save accepted submissions to a private D1 table.
-   Return a clear success or error response.

Use D1 only for the submission queue, not as a second general-purpose
CMS.

An editor can review pending submissions through a protected
administrative workflow or a controlled operational process, then create
an approved Job document in Decap. The public site must never display
unreviewed submissions.

A minimal implementation may begin with a secure review process that
does not require a custom dashboard. If a dashboard is introduced, it
must have proper authentication and authorisation.

### 7.4 D1 data model

Suggested `job_submissions` table:

  Column                Type               Purpose
  --------------------- ------------------ -----------------------------
  id                    TEXT primary key   Submission identifier
  organisation          TEXT               Organisation name
  contact_name          TEXT               Contact person
  contact_email         TEXT               Contact email
  job_title             TEXT               Vacancy title
  location              TEXT               Location
  employment_type       TEXT               Employment type
  description           TEXT               Submitted description
  deadline              TEXT               Deadline
  application_details   TEXT               How to apply
  source_url            TEXT nullable      Employer/source URL
  status                TEXT               pending, reviewed, rejected
  created_at            TEXT               Submission timestamp
  reviewed_at           TEXT nullable      Review timestamp

Do not store unnecessary sensitive applicant information. The form is
for employers submitting vacancies, not applicants applying for jobs.

### 7.5 Notifications

Email notification is optional because a reliable, permanently free
transactional email service cannot be assumed.

The initial workflow must remain usable without email delivery. Editors
should have a documented way to inspect pending submissions.

If email is added, use a provider whose current free allowance and terms
have been checked. Keep delivery credentials in Cloudflare secrets.

------------------------------------------------------------------------

## 8. Search and discovery

### 8.1 Initial search

For a static-first site, generate a search index at build time.

The index can contain:

-   Article title.
-   Excerpt.
-   Category.
-   Publication date.
-   URL.
-   Content type.
-   Selected searchable text.

Use a lightweight client-side search library or a small custom search
implementation. Keep separate search scopes for News and Work.

For jobs, provide practical filters:

-   Keyword.
-   Location.
-   Employment type.
-   Work arrangement.
-   Category, if applicable.
-   Active versus expired listings.

Do not load the entire article body into the browser search index. Keep
the index compact.

### 8.2 Future search

A dedicated search service should only be introduced if the content
volume and search requirements justify it. Do not introduce a paid
hosted search dependency in the initial release.

------------------------------------------------------------------------

## 9. Media and image strategy

### 9.1 Initial media storage

Initially, images may be stored in the repository under
`public/uploads/` and committed through Decap.

Requirements:

-   Resize and compress images before upload.
-   Prefer WebP or AVIF for suitable photographs, with sensible
    fallbacks where needed.
-   Use descriptive filenames.
-   Provide alt text.
-   Preserve image captions and credits.
-   Generate responsive image sizes where practical.
-   Avoid committing original multi-megabyte camera files.
-   Establish a maximum upload size and editorial image guidance.

Git-based media storage is simple but not ideal for an indefinitely
growing image archive. Repository size must be monitored.

### 9.2 Future R2 migration

Cloudflare R2 may be introduced when media volume makes Git storage
inconvenient.

R2 is not automatically a Decap media library. A custom upload
integration or an alternative editorial media workflow will be required.

Do not add R2 until its operational benefit outweighs the additional
integration work.

------------------------------------------------------------------------

## 10. Cloudflare deployment

### 10.1 Initial hosting

Use Cloudflare Pages connected to the GitHub repository.

Expected deployment flow:

1.  Editor publishes or merges content.
2.  GitHub receives the commit.
3.  Cloudflare Pages detects the change.
4.  Astro builds the site.
5.  Cloudflare deploys the generated static output.

Use preview deployments for pull requests and staging checks.

### 10.2 Build configuration

The exact commands should be confirmed against the selected Astro
adapter and project setup.

Typical Astro static build:

``` bash
npm ci
npm run build
```

Typical output directory:

``` text
dist/
```

Do not add a server adapter merely because the project uses Cloudflare.
A static Astro site can be deployed as static assets. Add the Cloudflare
adapter/Functions only when server-side functionality is actually
needed.

### 10.3 Cloudflare Functions

Use Functions only for features that need server-side execution:

-   Employer submissions.
-   Turnstile verification.
-   D1 operations.
-   OAuth callback/proxy, if required.
-   Revalidation or other narrowly scoped endpoints, if applicable.

Static article and job-detail requests should not invoke a Worker
unnecessarily.

### 10.4 Free-tier controls

Provider limits and pricing change. Verify the current official limits
before launch and record the verification date in the deployment
documentation.

Operational safeguards:

-   Monitor build usage.
-   Keep the number of builds sensible.
-   Avoid rebuilding for irrelevant repository changes.
-   Optimise image size.
-   Keep Functions narrow and inexpensive.
-   Monitor D1 storage and operations.
-   Keep a backup of the GitHub repository.
-   Avoid dependencies on a free allowance that is close to its limit.

A free plan is not an unconditional uptime or unlimited-usage guarantee.

------------------------------------------------------------------------

## 11. SEO and URL migration

SEO preservation is a critical project requirement.

### 11.1 Pre-migration audit

The migration inputs are intentionally split by section. The current News
implementation uses placeholder/fixture content and must remain separate from
the authoritative Work dataset. Work article migration must use the pinned
`posts/` directory from the `amssegu/ssegu` GitHub repository:

`https://github.com/amssegu/ssegu/tree/main/posts`

Phase 7 must pin the commit/ref, record retrieval date and file count, preserve
the original files read-only, calculate checksums where practical and document
media/source limitations. The Work dataset must populate Work collections only;
it must never be merged into News or used to replace the News placeholder
fixtures before an approved News dataset is supplied.

For each approved source, inventory:

-   Published posts and pages.
-   Original URLs.
-   Slugs.
-   Publication dates.
-   Updated dates.
-   Titles and descriptions.
-   Labels/categories.
-   Authors.
-   Images and embeds.
-   Canonical tags, where present.
-   Search Console clicks, impressions and indexed URLs.
-   Existing redirects.

The generic Blogger inventory requirements apply to any future approved News
export and to the historical Work source only where the corresponding field is
present. They do not authorize replacing the current News placeholder dataset
with the Work GitHub records.

Export or otherwise preserve each approved section source. The Work GitHub
`posts/` tree is the current authoritative Work source; any future approved
News export must be supplemented with a media audit because an export does not
guarantee that all original image files are locally available.

### 11.2 Migration utility

Create a repeatable migration script that:

1.  Parses Blogger XML/Atom exports.
2.  Extracts posts and pages.
3.  Records original URLs.
4.  Maps labels to new categories.
5.  Preserves dates and authors where possible.
6.  Downloads or reconciles media assets.
7.  Converts article HTML to the chosen Markdown/content representation.
8.  Flags unsupported or suspicious markup.
9.  Creates content files in the new repository.
10. Produces a migration report.

Do not assume that automated HTML conversion will preserve every table,
embed, caption or unusual layout. Flag these for manual review.

### 11.3 Redirect mapping

Create a CSV with at least:

``` text
old_url,new_url,redirect_type,verified
```

Use permanent redirects for pages that have moved permanently.

Rules:

-   Map old articles to their exact new articles.
-   Map old jobs to the closest relevant new job or archive page where
    appropriate.
-   Avoid redirecting unrelated pages to the homepage.
-   Preserve useful query parameters.
-   Check for redirect loops.
-   Ensure the old Work subdomain redirects to the main domain's
    `/work/` paths.
-   Return 404 or 410 where no meaningful replacement exists.

Test every important redirect before DNS cutover.

### 11.4 SEO implementation

Implement:

-   Unique title and meta description.
-   Canonical URLs.
-   XML sitemap index.
-   Separate sitemap sections for news and Work.
-   Robots.txt.
-   Open Graph and social metadata.
-   Article structured data.
-   Breadcrumb structured data.
-   JobPosting structured data for eligible, current vacancies.
-   RSS feed(s).
-   Correct pagination metadata where applicable.
-   Proper 404 pages.
-   Search Console verification.

Do not mark expired vacancies as active JobPosting content.

### 11.5 Launch monitoring

After launch:

-   Submit the new sitemap in Google Search Console.
-   Monitor indexed pages and crawl errors.
-   Monitor 404s and redirect failures.
-   Compare search performance with the pre-migration baseline.
-   Fix incorrect canonical URLs.
-   Keep old redirect infrastructure active.

------------------------------------------------------------------------

## 12. Security and operational requirements

### 12.1 Secrets

Never commit:

-   GitHub OAuth client secrets.
-   Cloudflare API tokens.
-   D1 credentials or sensitive bindings.
-   Email provider API keys.
-   Any private service token.

Use Cloudflare environment secrets and local environment files excluded
by `.gitignore`.

### 12.2 CMS security

-   Require authentication for `/admin/`.
-   Limit GitHub repository access to approved editors and developers.
-   Remove access promptly when a contributor leaves.
-   Do not share administrator accounts.
-   Use branch protection and pull-request review where practical.
-   Keep dependencies updated.
-   Protect production secrets from preview deployments.

### 12.3 Submission security

-   Validate every field server-side.
-   Enforce request-size limits.
-   Use Turnstile or an equivalent anti-abuse mechanism.
-   Rate-limit submissions.
-   Escape output when rendering submitted content.
-   Do not trust client-side validation.
-   Do not expose pending submissions publicly.
-   Avoid collecting unnecessary personal data.
-   Document retention and deletion procedures.

### 12.4 Backups

GitHub provides version history, but it should not be the only backup.

Maintain periodic repository backups, including:

-   Source code.
-   Content files.
-   Media assets.
-   CMS configuration.
-   Redirect map.
-   D1 data export, if D1 is used.
-   Deployment documentation.

Test that a backup can actually be restored.

------------------------------------------------------------------------

## 13. Performance and accessibility

### 13.1 Performance goals

The site should be designed for low-bandwidth mobile access as well as
desktop.

Requirements:

-   Static HTML for ordinary content pages.
-   Optimised responsive images.
-   Lazy loading for below-the-fold images.
-   Avoid unnecessary client-side JavaScript.
-   Use modern font formats and sensible font loading.
-   Avoid large third-party scripts.
-   Cache static assets effectively.
-   Prevent layout shifts by specifying image dimensions.
-   Keep homepage modules efficient.

Targets to use as project goals, not guarantees:

  Metric                                             Target
  --------------------------- -----------------------------
  Lighthouse Performance        90+ on representative pages
  Lighthouse Accessibility                              95+
  Lighthouse SEO                                        95+
  Largest Contentful Paint                Under 2.5 seconds
  Cumulative Layout Shift                         Under 0.1
  Interaction to Next Paint                    Under 200 ms

Measure representative mobile pages under realistic network conditions.
Do not optimise solely for a desktop development machine.

### 13.2 Accessibility

-   Semantic HTML.
-   Keyboard-operable navigation.
-   Visible focus states.
-   Correct heading hierarchy.
-   Useful alt text.
-   Sufficient colour contrast.
-   Labels and error messages for forms.
-   No colour-only status indicators.
-   Respect reduced-motion preferences.

------------------------------------------------------------------------

## 14. Testing and acceptance criteria

### 14.1 Design and routing

-   [ ] `/` displays the News experience.
-   [ ] `/work/` displays a visually independent Work experience.
-   [ ] News and Work have independent headers and footers.
-   [ ] Navigation between sections works.
-   [ ] All defined routes resolve correctly.
-   [ ] Mobile layouts work in both sections.
-   [ ] No route collisions exist.

### 14.2 CMS

-   [ ] Editor can log in without developer intervention.
-   [ ] Editor can create, edit, preview and publish a news article.
-   [ ] Editor can manage categories and authors.
-   [ ] Editor can create and publish a job.
-   [ ] Drafts do not appear publicly.
-   [ ] Images upload and display correctly.
-   [ ] Editorial workflow behaves as documented.
-   [ ] A non-technical editor passes the usability test.

### 14.3 Job submissions

-   [ ] Public submission form works.
-   [ ] Required fields are validated server-side.
-   [ ] Turnstile verification works.
-   [ ] Rate limiting works.
-   [ ] Pending submissions are not public.
-   [ ] Editors can review and publish approved vacancies.
-   [ ] Invalid and abusive submissions are rejected.
-   [ ] The system works without optional email notifications.

### 14.4 Migration and SEO

-   [ ] All important old URLs are accounted for.
-   [ ] Redirects point to relevant destinations.
-   [ ] No redirect loops exist.
-   [ ] Article dates and authors are preserved where available.
-   [ ] Images and embeds have been reviewed.
-   [ ] Canonical URLs are correct.
-   [ ] Sitemaps validate.
-   [ ] Structured data validates.
-   [ ] 404 pages behave correctly.
-   [ ] Old Work subdomain redirects are active.

### 14.5 Operations

-   [ ] Production deployment works from GitHub.
-   [ ] Preview deployment works.
-   [ ] Secrets are not present in the repository.
-   [ ] Repository backup is available.
-   [ ] D1 backup/restore is tested if applicable.
-   [ ] Rollback procedure is documented.
-   [ ] Provider quotas have been checked.

------------------------------------------------------------------------

## 15. Implementation phases

### Phase 1 --- Discovery and audit

Deliverables:

-   Provenance-recorded News source decision and pinned Work GitHub `posts/` source.
-   Content and media inventory.
-   URL and redirect spreadsheet.
-   Search Console baseline.
-   Confirmed route map.
-   Identify special content and embeds.

**Exit condition:** No major content or URL uncertainty remains.

### Phase 2 --- Foundation

Deliverables:

-   GitHub repository.
-   Astro application.
-   TypeScript and Tailwind.
-   Cloudflare Pages deployment.
-   Preview deployment.
-   Basic News and Work layouts.
-   Environment and secrets documentation.

**Exit condition:** Both section shells deploy successfully.

### Phase 3 --- Design and frontend

Deliverables:

-   News homepage.
-   News category pages.
-   Article detail pages.
-   Work homepage.
-   Job listing and detail pages.
-   Career advice and course pages.
-   Responsive navigation and footers.
-   Search and filtering interface.

**Exit condition:** Both experiences are functionally navigable with
sample content.

### Phase 4 --- CMS

Deliverables:

-   Decap configuration.
-   GitHub OAuth setup.
-   News collections.
-   Work collections.
-   Editorial workflow.
-   Image handling.
-   Editor usability test.

**Exit condition:** A non-developer can publish both an article and a
job.

### Phase 5 --- Employer submissions

Deliverables:

-   Submission form.
-   Pages Function.
-   Validation and Turnstile.
-   D1 submission storage if required.
-   Protected review process.
-   Documentation for editors.

**Exit condition:** A submission can be received, reviewed and manually
published safely.

### Phase 6 --- Migration

Deliverables:

-   Blogger import utility.
-   Migrated news and Work content.
-   Reconciled images.
-   Reviewed formatting.
-   Redirect map.
-   Migration report.

**Exit condition:** Important content and URLs have been verified.

### Phase 7 --- Quality assurance and launch

Deliverables:

-   Mobile and desktop testing.
-   Performance and accessibility checks.
-   SEO validation.
-   Redirect testing.
-   Production DNS cutover.
-   Search Console submission.
-   Rollback plan.

**Exit condition:** Production acceptance checklist is complete.

------------------------------------------------------------------------

## 16. Future expansion

The architecture should leave room for these features without
implementing them in the initial release:

  Future feature         Possible implementation
  ---------------------- -----------------------------------------------------
  User accounts          Supabase Auth or another suitable identity provider
  Employer accounts      Auth + transactional database
  Applicant profiles     PostgreSQL
  Saved jobs             PostgreSQL
  Online applications    Secure application backend and file storage
  Employer dashboards    Authenticated application routes
  Advanced search        Dedicated search index/service
  Larger media library   Cloudflare R2 with custom CMS integration
  Editorial analytics    Privacy-conscious analytics
  Notifications          Transactional email provider

When accounts are introduced, keep Sanity/Decap-style editorial content
management separate from transactional user data. Do not turn GitHub
into an application database.

------------------------------------------------------------------------

## 17. Key risks and mitigations

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Editors struggle with GitHub-based  Test with a non-technical editor
  CMS                                 before migration

  OAuth setup becomes unreliable      Prototype authentication early

  Repository becomes too large        Compress images and plan media
                                      storage limits

  Blogger formatting does not convert Produce a migration report and
  cleanly                             manually review exceptions

  Search rankings decline             Preserve URLs and implement
                                      verified redirects

  Free-tier quotas change             Monitor usage and keep a
                                      provider-independent content backup

  Employer spam                       Server validation, Turnstile and
                                      rate limiting

  Unverified or fraudulent vacancies  Editorial review and source checks

  Static rebuilds become slow         Optimise build pipeline and monitor
                                      build duration

  Too much scope is added             Keep accounts, applications and
                                      dashboards out of v1
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 18. Final technical decisions

The following is the baseline implementation decision record.

  -----------------------------------------------------------------------
  Area                                Decision
  ----------------------------------- -----------------------------------
  Architecture                        One website, two independent
                                      experiences

  Domain                              `ssegu.com`

  Work route                          `/work/`

  Framework                           Astro

  Language                            TypeScript

  Styling                             Tailwind CSS

  CMS                                 Decap CMS

  Content storage                     GitHub repository

  Hosting                             Cloudflare Pages

  Server-side endpoints               Cloudflare Pages Functions

  Authentication for CMS              GitHub OAuth via compatible OAuth
                                      callback/proxy

  Submission storage                  Cloudflare D1 if required

  Anti-spam                           Cloudflare Turnstile

  Initial media storage               Optimised repository assets

  Future media storage                Cloudflare R2, if justified

  Search                              Build-time static index

  User accounts                       Deferred

  Employer dashboards                 Deferred

  Applicant tracking                  Deferred

  CMS subscription                    None planned

  Hosting subscription                None planned

  Database subscription               None planned
  -----------------------------------------------------------------------

### Non-negotiable project principles

1.  One domain, one repository and one production website.
2.  News and Work must have independent visual identities.
3.  The website should be static-first.
4.  Content must remain portable and backed up.
5.  Employer submissions must be reviewed before publication.
6.  Existing URLs and search visibility must be treated as migration
    assets.
7.  No paid dependency should be introduced without explicit client
    approval.
8.  Free-tier limits must be verified and monitored; no provider's free
    plan is a perpetual unlimited-use guarantee.
9.  Do not build future account or recruitment functionality before it
    is needed.
10. Editorial usability must be proven before bulk migration.

------------------------------------------------------------------------

## 19. Official technical references

Check current documentation before implementation, especially where
provider plans and integration behaviour can change.

-   Astro: https://docs.astro.build/
-   Astro Cloudflare deployment:
    https://docs.astro.build/en/guides/deploy/cloudflare/
-   Decap CMS: https://decapcms.org/docs/intro/
-   Decap GitHub backend: https://decapcms.org/docs/backends-overview/
-   Decap editorial workflow:
    https://decapcms.org/docs/editorial-workflows/
-   Decap configuration:
    https://decapcms.org/docs/configuration-options/
-   Cloudflare Pages: https://developers.cloudflare.com/pages/
-   Cloudflare Pages Functions:
    https://developers.cloudflare.com/pages/functions/
-   Cloudflare D1: https://developers.cloudflare.com/d1/
-   Cloudflare R2: https://developers.cloudflare.com/r2/
-   Cloudflare Turnstile: https://developers.cloudflare.com/turnstile/
-   GitHub Pages and repository documentation: https://docs.github.com/
-   Blogger Help: https://support.google.com/blogger/

**Document status:** This specification records the agreed direction and
proposed implementation. Exact provider quotas, authentication
integration details, deployment configuration and migration mappings
must be verified during implementation. It is not a claim that the
production system has already been built or tested.
