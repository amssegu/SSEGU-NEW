# Phase 5 Content Model

Phase 5 introduces typed Astro content collections and matching Decap CMS
collections. The repository fixtures are synthetic and remain drafts; they
are validation inputs, not the authoritative News or Work migration datasets.

## Collection boundary

News and Work use separate collections and route namespaces:

| Section | Collections | Public route boundary |
| --- | --- | --- |
| News | `articles`, `categories`, `authors`, `pages` | `/`, `/news/`, `/category/`, article slugs |
| Work | `jobs`, `internships`, `work-articles`, `work-categories`, `courses`, `employers` | `/work/` |
| Shared configuration | `navigation`, `site-settings`, `redirects` | Not directly public |

Schemas live in [`src/content.config.ts`](../src/content.config.ts). Long-form
records use Markdown with YAML frontmatter; singleton/configuration records use
JSON. Slugs must be lowercase URL-safe values and match the entry filename.

## Editorial rules

- `draft`, `published` and `expired` are explicit content states.
- A News article must reference an existing author and News category.
- A Work article must reference an existing author and Work category.
- A job or internship must reference an employer, source URL, verification note
  and a matching application detail (`applicationUrl`, `applicationEmail` or
  `applicationInstructions`).
- Salary, deadlines, employer facts, qualifications and eligibility are never
  invented. Synthetic fixture values are marked as drafts and must not be
  migrated as authoritative content.
- Every supplied image requires non-empty alt text. Caption and credit are
  preserved when supplied.

`npm run validate:content` checks collection parsing, filename/slug stability,
duplicate slugs, cross-collection references, News/Work boundaries, application
requirements and media metadata. `npm run check` additionally runs Astro's
collection schema and reference validation. Expected invalid examples are kept
under [`project-spec/content-fixtures/invalid/`](../project-spec/content-fixtures/invalid/).

## Decap CMS

The editor is served at `/admin/` using [`public/admin/config.yml`](../public/admin/config.yml).
The configuration mirrors the Astro field names and uses `public/uploads/` for
repository media. Editors should supply descriptive filenames, approved image
formats, dimensions appropriate to the placement, alt text, caption and credit.
The CMS configuration cannot verify image dimensions by itself; validation and
editorial review remain required.

The selected workflow is Decap's `editorial_workflow`: an author creates a
draft branch, an editor reviews the preview, and the approved change is merged
before deployment. This keeps drafts private and creates a reviewable Git
history. Direct publishing is not enabled in this phase.

The GitHub repository is `c4rrotJuice/ssegu`. GitHub OAuth application setup,
the callback/proxy URL, Cloudflare secret storage and a real editor login have
not been verified in this local workspace. Phase 5.3 and 5.4 therefore remain
environment-dependent acceptance work; no authentication or publishing PASS is
claimed here. Production access should be least-privilege repository access for
named editors, with onboarding and removal handled by the repository owner.
