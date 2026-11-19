# Phase 00 source permission register

**Checked:** 19 November 2026 (Africa/Kampala)
**Policy:** public accessibility and `robots.txt` are not treated as reuse permission. A source may be enabled only after the evidence and project-owner approval satisfy the aggregation specification.

| Source / type | Exact endpoint | Terms / evidence URL | Permission class | Commercial/ad-supported | Permitted fields | Attribution | Limits / credentials / expiry | SEO restriction | Status |
|---|---|---|---|---|---|---|---|---|---|
| JubaJobs / jobs JSON feed | `https://jubajobs.com/feed/jobs?format=json` (observed 15 Nov 2026) | `https://jubajobs.com/partners` | `redistribute_with_attribution` | **Approved by project owner on 15 Nov 2026** for this site’s factual metadata use; official partner page permits sites to use free feeds with backlinks and does not state a non-commercial restriction | `id`, `url`, `title`, `organization`, `location`, `category`, `deadline`, `posted_at`, `summary`; permitted display is limited to factual metadata and source-approved excerpt | Required: “Listings gathered by JubaJobs. Link back to the listing when you reuse it.” plus direct listing backlink | Partner page says feeds update every 15 minutes; SSEGU remains capped at twice daily; no credentials documented; remove/close on source signal | No source-specific SEO rule confirmed; preserve canonical JubaJobs link | approved and enabled for controlled Phase 05 ingestion |
| JubaJobs / tenders feed | `https://jubajobs.com/feed/tenders` | `https://jubajobs.com/partners` | `permission_required` | Not established | Pending confirmation | JubaJobs + backlink | Same as above; not fetched or scheduled | Not established | disabled |
| JubaJobs / opportunities feed | `https://jubajobs.com/feed/opportunities` | `https://jubajobs.com/partners` | `permission_required` | Not established | Pending confirmation | JubaJobs + backlink | Same as above; taxonomy/retention needs approval | Not established | disabled |
| YubHub / Operations RSS feed | `https://feeds.yubhub.co/facet/category/operations.rss` | `https://yubhub.co/free-job-feeds/` | `redistribute_with_attribution` | Official page says free feeds may be redistributed with attribution; no API key; refreshed daily | Factual listing metadata and original link; do not copy full descriptions until feed fields are reviewed | Required: preserve “Data by YubHub” credit and link to `https://yubhub.co` | RSS/JSON/XML formats; daily refresh; selected Operations scope | No source-specific SEO restriction stated; preserve original listing link | **approved by project owner on 16 Nov 2026 and enabled for controlled Phase 05 ingestion** |
| ReliefWeb / jobs API | `https://api.reliefweb.int/v2/jobs?appname=APPROVED_APPNAME` | `https://apidoc.reliefweb.int/`; explorer `https://api.reliefweb.int/v2/swagger/api` | `permission_required` | Every request requires a pre-approved `appname`; project owner approves reuse of publisher fields, subject to ReliefWeb terms | Minimal approved metadata only after appname approval and field-level validation | ReliefWeb and original publisher attribution as required | Appname approval is external; preserve records on outage; handle withdrawals | `JobPosting` eligibility not established | **disabled; appname approval required** |
| Remote OK / JSON API | `https://remoteok.com/api` | `https://remoteok.com/faq` | `redistribute_with_attribution` | Official FAQ says free, unauthenticated feeds may be used by aggregators with credit and direct links | Factual fields from approved response; no copied full text beyond feed fields | Required: credit Remote OK and link each original job post | No credentials; JSON may be filtered by tag; remove closed/expired listings when observed | No source-specific restriction stated; preserve original link | **approved by project owner on 16 Nov 2026 and enabled for controlled Phase 05 ingestion** |
| Remote OK / RSS | `https://remoteok.com/remote-jobs.rss` | `https://remoteok.com/faq` | `redistribute_with_attribution` | Same as JSON API | Same as JSON API | Same as JSON API | Same as JSON API | Same as JSON API | **approved by project owner on 16 Nov 2026 and enabled for controlled Phase 05 ingestion** |
| Himalayas / remote jobs API | `https://himalayas.app/jobs/api?limit=20` | `https://himalayas.app/docs/remote-jobs-api`; `https://himalayas.app/terms` | `metadata_only` | Official API docs permit display on an own site without asking; API key optional, but terms must still be accepted for keyed use | Approved factual fields; preserve `guid`, salary fields, expiry fields and `applicationLink` unchanged | Visible Himalayas credit and link back to Himalayas/original listing | Max 20 per page; cursor pagination; daily refresh; remove on 410/closed status; API key must remain secret | **Do not pass to other job boards, Google Jobs or LinkedIn; never emit `JobPosting`** | **approved by project owner on 16 Nov 2026 and enabled for controlled Phase 05 ingestion** |
| MIT OpenCourseWare / link-only catalogue | No feed endpoint approved; exact course URLs only after curation | `https://www.ocw.mit.edu/pages/privacy-and-terms-of-use/` | `link_only` | Owner-approved manual catalogue review. OCW materials are CC BY-NC-SA; do not copy/mirror materials or place copied OCW material in SSEGU's ad-supported pages without separate permission | Verified factual metadata and exact course URL only; no course materials or copied full descriptions | Attribute MIT OpenCourseWare and link the exact course; do not imply endorsement or use MIT marks | Manual record recheck only; no API/refresh rule approved | No course-content republication or unsupported course claims | owner-approved manual review; automated ingestion disabled |
| OpenLearn / link-only catalogue | No feed endpoint approved; exact course URLs only after curation | `https://www.open.edu/openlearn/about-openlearn/frequently-asked-questions-on-openlearn`; `https://about.open.ac.uk/strategy-and-policies/policies-and-statements/copyright-openlearn` | `link_only` | Owner-approved manual catalogue review. OpenLearn says aggregation is not adaptation and prohibits advertising around unadapted content; SSEGU must link out and must not copy course content | Verified factual metadata and exact course URL only; no lesson text, images or copied full descriptions | Identify OpenLearn/The Open University and do not imply affiliation or endorsement | Manual availability and certificate-cost recheck only; no API/refresh rule approved | No copied material or ad-wrapped OpenLearn content | owner-approved manual review; automated ingestion disabled |
| Saylor Academy / catalogue/API candidate | `https://www.saylor.org/CourseCatalog`; API docs `https://saylordotorg.github.io/api-docs/` | `https://www.saylor.org/TermsOfUse`; API authentication requirements | `permission_required` | Owner-approved investigation only. The API requires an authentication token; course/content use must follow the applicable licence and attribution requirements | Metadata and direct link only after token access, terms review and record validation | Saylor Academy plus the direct course link | No token, endpoint scope, rate or refresh agreement configured | No copied course materials or unsupported certificate/credit claims | owner-approved investigation; API ingestion disabled |
| OER Commons / catalogue | `https://www.oercommons.org/` | Item-level licence and current site terms required | `permission_required` | Owner-approved investigation only. OER licences vary, so approval is record-by-record rather than source-wide | Item title, provider, licence, subject and direct link only after item-level review | Original creator/provider and exact item licence attribution | No source-wide API/refresh rule; recheck when licence or URL changes | Respect each item licence; no copied resources or unsupported schema | owner-approved investigation; automated ingestion disabled |
| freeCodeCamp / learning catalogue | `https://www.freecodecamp.org/learn/` | `https://opensource.freecodecamp.org/terms-of-service/`; `https://www.freecodecamp.org/news/about` | `link_only` | Owner-approved manual direct-link review. Site terms prohibit automated access/crawling except public-search indexing; no false affiliation | Title, pathway/topic and direct link only; no copied curriculum, challenge text, images or user content | Identify freeCodeCamp and state SSEGU is independent and not endorsed | Manual recheck only; no crawler/API refresh | No automated scraping, copied curriculum or affiliation claim | owner-approved manual review; automated ingestion disabled |

## Decision

JubaJobs, Remote OK, YubHub and Himalayas are approved by the project owner
and enabled for controlled Phase 05 ingestion. ReliefWeb remains blocked until
its appname is approved; the project owner has approved reuse of its publisher
fields, subject to the source terms and field-level validation. The two course
source groups are owner-approved for evaluation, but remain disabled for
automated ingestion until their source-specific requirements are satisfied.

### Owner approval and operational boundary — 19 November 2026

Developer and project owner Andronicus Enoch Muwanguzi approved these five
course sources for evaluation and documentation. That approval does not
override a source's terms, licence, authentication requirement or
record-level rights. Until the source-specific gates are satisfied, the
course pipeline must remain manual/link-only and must not crawl or copy course
materials.

The permitted catalogue fields are intentionally narrow: title, provider,
subject or pathway, level, delivery mode, duration, visible price or
certificate status, exact source URL, source attribution and verification
date. Course descriptions, lesson text, images, downloadable materials and
user-submitted content are not imported. Each record must retain its source
URL, attribution and licence/terms note, and must be removed or rechecked when
the source URL, availability or licence changes.

Operational status:

- MIT OpenCourseWare and OpenLearn: manual link-only records only; their
  non-commercial/share-alike rules make copied or ad-wrapped course material
  unsuitable for this ad-supported site.
- Saylor Academy: no ingestion until an approved API token, endpoint scope,
  rate limits and terms review are recorded.
- OER Commons: manual item-level licence review is mandatory; no source-wide
  permission is assumed.
- freeCodeCamp: manual direct links only; automated crawling is prohibited by
  the site's acceptable-use terms.

Evidence checked on 19 November 2026:

- MIT OpenCourseWare: https://www.ocw.mit.edu/pages/privacy-and-terms-of-use/
- OpenLearn: https://www.open.edu/openlearn/about-openlearn/frequently-asked-questions-on-openlearn
- Saylor API and terms: https://saylordotorg.github.io/api-docs/ and
  https://www.saylor.org/TermsOfUse
- OER Commons: https://www.oercommons.org/
- freeCodeCamp: https://opensource.freecodecamp.org/terms-of-service/ and
  https://www.freecodecamp.org/news/about

## First-party evidence checked

- Remote OK FAQ: `https://remoteok.com/faq` — JSON/RSS endpoints are public and
  unauthenticated; aggregators must credit Remote OK and link original posts.
- YubHub feed catalogue: `https://yubhub.co/free-job-feeds/` — free feeds may
  be redistributed with attribution, are refreshed daily, and retain the
  “Data by YubHub” link.
- ReliefWeb API documentation: `https://apidoc.reliefweb.int/` — every request
  requires a pre-approved `appname`.
- Himalayas API documentation: `https://himalayas.app/docs/remote-jobs-api` —
  own-site display is permitted with visible attribution, applications must
  use `applicationLink`, closed jobs must be removed, and Google/JobPosting
  syndication is prohibited.
