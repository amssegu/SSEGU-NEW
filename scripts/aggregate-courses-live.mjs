import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const now = new Date().toISOString();
const out = process.env.RUNNER_TEMP || '/tmp';
const sqlPath = join(out, 'ssegu-courses-aggregation.sql');
const reportPath =
  process.env.COURSE_LIVE_REPORT_PATH ?? join(out, 'ssegu-courses-live-report.json');
const sources = [
  {
    id: 'mit-ocw-courses',
    slug: 'mit-ocw-courses',
    name: 'MIT OpenCourseWare',
    endpoint: 'https://ocw.mit.edu/sitemap.xml',
    terms: 'https://www.ocw.mit.edu/pages/privacy-and-terms-of-use/',
    attribution:
      'Course details link to MIT OpenCourseWare. MIT does not award credit or certificates for this material.',
  },
  {
    id: 'openlearn-courses',
    slug: 'openlearn-courses',
    name: 'OpenLearn',
    endpoint: 'https://www.open.edu/openlearn/rss.xml?feed=course',
    terms: 'https://www.open.edu/openlearn/about-openlearn/frequently-asked-questions-on-openlearn',
    attribution:
      'Course details link to OpenLearn. SSEGU is not affiliated with The Open University.',
  },
  {
    id: 'freecodecamp-courses',
    slug: 'freecodecamp-courses',
    name: 'freeCodeCamp',
    endpoint: 'https://curriculum-db.freecodecamp.org/graphql',
    terms: 'https://opensource.freecodecamp.org/terms-of-service/',
    attribution: 'Course details link to freeCodeCamp. SSEGU is not affiliated with the provider.',
  },
];
const esc = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
const tag = (xml, name) =>
  decode(
    xml
      .match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'))?.[1]
      ?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/<[^>]+>/g, '') ?? '',
  );
const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/xml, application/rss+xml, application/json',
      'user-agent': 'SSEGU-Course-Aggregator/1.0',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  const body = await response.text();
  if (body.length > 8_000_000) throw new Error('provider response exceeds 8 MB');
  return body;
}
async function getCourses(source) {
  if (source.id === 'freecodecamp-courses') {
    const response = await fetch(source.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ query: '{ curriculum { superblocks certifications } }' }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} from freeCodeCamp curriculum API`);
    const payload = await response.json();
    const names = payload?.data?.curriculum?.certifications;
    if (!Array.isArray(names) || names.length === 0)
      throw new Error('freeCodeCamp API returned no certifications');
    return [...new Set(names)].map((name) => ({
      id: name,
      title: String(name)
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      url: `https://www.freecodecamp.org/learn/${name}/`,
      subject: 'Technology',
      level: 'Beginner',
    }));
  }
  const xml = await fetchText(source.endpoint);
  let entries;
  if (source.id === 'openlearn-courses') {
    entries = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(([, item]) => ({
      id: tag(item, 'guid') || tag(item, 'link'),
      title: tag(item, 'title'),
      url: tag(item, 'link'),
      summary: tag(item, 'description'),
    }));
    if (!entries.length) throw new Error('OpenLearn course RSS contained no items');
  } else {
    entries = [...xml.matchAll(/<sitemap\b[^>]*>([\s\S]*?)<\/sitemap>/gi)]
      .map(([, item]) => tag(item, 'loc'))
      .filter((loc) => /\/courses\/[^/]+\/sitemap\.xml$/.test(loc))
      .map((loc) => {
        const url = loc.replace(/sitemap\.xml$/, '');
        const id = url.split('/').filter(Boolean).at(-1);
        return {
          id: url,
          title: id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          url,
        };
      });
    if (!entries.length) throw new Error('MIT sitemap contained no course URLs');
    entries = entries.map((r) => ({
      ...r,
      title: r.url
        .split('/')
        .filter(Boolean)
        .at(-1)
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
  }
  return entries;
}
const sqlValue = (v) => (v == null ? 'NULL' : `'${String(v).replaceAll("'", "''")}'`);
const stmt = (sql, values) =>
  `${sql
    .replace(/\?/g, () => sqlValue(values.shift()))
    .trim()
    .replace(/;$/, '')};`;
const statements = [];
const sourceResults = [];
for (const source of sources) {
  let courses;
  try {
    courses = await getCourses(source);
  } catch (e) {
    sourceResults.push({
      sourceId: source.id,
      source: source.name,
      outcome: 'failed',
      fetchedCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      errorSummary: String(e).slice(0, 300),
    });
    continue;
  }
  const records = courses
    .map((c) => ({ ...c, url: c.url?.startsWith('http') ? c.url : '' }))
    .filter((c) => c.id && c.title && c.url);
  const unique = [...new Map(records.map((r) => [r.url, r])).values()];
  if (!unique.length) {
    sourceResults.push({
      sourceId: source.id,
      source: source.name,
      outcome: 'failed',
      fetchedCount: courses.length,
      acceptedCount: 0,
      rejectedCount: courses.length,
      errorSummary: 'provider returned no valid course records',
    });
    continue;
  }
  statements.push(
    stmt(
      `INSERT INTO content_sources (id,slug,name,source_type,endpoint_url,terms_url,permission_class,attribution_text,enabled,restriction_flags_json,reviewed_at,created_at,updated_at) VALUES (?,?,?,'course_catalogue',?,?,'link_only',?,1,'{}',?,?,?) ON CONFLICT(id) DO UPDATE SET endpoint_url=excluded.endpoint_url,terms_url=excluded.terms_url,attribution_text=excluded.attribution_text,enabled=1,reviewed_at=excluded.reviewed_at,updated_at=excluded.updated_at`,
      [
        source.id,
        source.slug,
        source.name,
        source.endpoint,
        source.terms,
        source.attribution,
        now,
        now,
        now,
      ],
    ),
  );
  const runId = `courses:${source.id}:${now}`;
  for (const c of unique) {
    const courseSlug = `${source.slug.replace(/-courses$/, '')}-${slug(c.title)}`.slice(0, 120);
    const hash = `sha256:${createHash('sha256').update(JSON.stringify(c)).digest('hex')}`;
    statements.push(
      stmt(
        `INSERT INTO courses (id,source_id,source_record_id,canonical_url,enrolment_url,slug,title,provider,summary,subject,level,delivery_mode,language,duration,course_price_status,certificate_price_status,availability_status,first_seen_at,last_seen_at,permission_type,content_hash,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'free','unknown','available',?,?, 'link_only',?,?,?) ON CONFLICT(source_id,source_record_id) DO UPDATE SET canonical_url=excluded.canonical_url,enrolment_url=excluded.enrolment_url,slug=excluded.slug,title=excluded.title,provider=excluded.provider,summary=excluded.summary,subject=excluded.subject,level=excluded.level,last_seen_at=excluded.last_seen_at,availability_status='available',content_hash=excluded.content_hash,updated_at=excluded.updated_at`,
        [
          `${source.id}:${slug(c.id)}`,
          source.id,
          String(c.id),
          c.url,
          c.url,
          courseSlug,
          c.title,
          source.name,
          c.summary || null,
          c.subject || null,
          c.level || null,
          'self_paced',
          'English',
          null,
          now,
          now,
          hash,
          now,
          now,
        ],
      ),
    );
  }
  statements.push(
    stmt(
      `INSERT INTO ingestion_runs (id,source_id,content_type,trigger,started_at,finished_at,result,fetched_count,accepted_count,rejected_count,error_summary) VALUES (?,?,'courses',?,?,?,?,?,?,?,?)`,
      [
        runId,
        source.id,
        process.env.GITHUB_EVENT_NAME === 'schedule' ? 'scheduled' : 'manual',
        now,
        now,
        records.length < courses.length ? 'partial' : 'success',
        courses.length,
        unique.length,
        courses.length - unique.length,
        null,
      ],
    ),
  );
  sourceResults.push({
    sourceId: source.id,
    source: source.name,
    outcome: records.length < courses.length ? 'partial' : 'success',
    fetchedCount: courses.length,
    acceptedCount: unique.length,
    rejectedCount: courses.length - unique.length,
  });
}
if (sourceResults.every((r) => r.outcome === 'failed'))
  throw new Error('all approved course sources failed; refusing D1 reconciliation');
await writeFile(sqlPath, `${statements.join('\n')}\n`);
await writeFile(
  reportPath,
  `${JSON.stringify({ generatedAt: now, reportOnly: false, sourceResults, sqlPath }, null, 2)}\n`,
);
console.log(`course ingestion plan written: ${sqlPath}`);
