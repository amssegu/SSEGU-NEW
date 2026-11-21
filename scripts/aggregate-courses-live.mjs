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
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
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
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    }
  }
  throw lastError;
}
function pageMetadata(html) {
  const meta = {};
  for (const match of html.matchAll(/<meta\b([^>]+)>/gi)) {
    const attributes = Object.fromEntries(
      [...match[1].matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)].map(([, key, , value]) => [
        key.toLowerCase(),
        value,
      ]),
    );
    const key = attributes.property || attributes.name;
    const value = attributes.content;
    if (key && value) meta[key.toLowerCase()] = decode(value);
  }
  const structured = [];
  for (const [, json] of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      structured.push(JSON.parse(json.trim()));
    } catch {
      // Ignore invalid structured data and retain the page metadata.
    }
  }
  const nodes = structured.flatMap((item) => (Array.isArray(item) ? item : [item]));
  const course = nodes.find((item) => {
    const type = item && typeof item === 'object' ? item['@type'] : undefined;
    return type === 'Course' || (Array.isArray(type) && type.includes('Course'));
  });
  return { meta, course: course ?? null };
}
async function enrichCourse(course) {
  try {
    const html = await fetchText(course.url);
    const details = pageMetadata(html);
    const structured = details.course ?? {};
    const description = structured.description || details.meta.description || details.meta['og:description'];
    const title = structured.name || details.meta['og:title'] || course.title;
    const subject = structured.about?.name || structured.provider?.name || details.meta['course:subject'];
    const level = structured.educationalLevel || details.meta['course:level'];
    const language = structured.inLanguage || details.meta['og:locale'];
    const duration = structured.timeRequired || details.meta['course:duration'];
    const free = structured.isAccessibleForFree === true || Number(structured.offers?.price) === 0;
    return {
      ...course,
      title,
      summary: course.summary || description,
      subject: course.subject || (typeof subject === 'string' ? subject : undefined),
      level: course.level || (typeof level === 'string' ? level : undefined),
      language: course.language || (typeof language === 'string' ? language : undefined),
      duration: course.duration || (typeof duration === 'string' ? duration : undefined),
      coursePriceStatus: course.coursePriceStatus || (free ? 'free' : undefined),
      sourceData: { ...(course.sourceData ?? {}), pageMetadata: details.meta, structuredCourse: details.course },
    };
  } catch {
    return course;
  }
}
async function mapConcurrent(items, limit, mapper, onProgress = () => {}) {
  const results = new Array(items.length);
  let next = 0;
  let completed = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await mapper(items[index]);
        completed += 1;
        if (completed % 100 === 0 || completed === items.length) onProgress(completed, items.length);
      }
    }),
  );
  return results;
}
async function getCourses(source) {
  if (source.id === 'freecodecamp-courses') {
    let payload;
    let lastError;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(source.endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ query: '{ curriculum { superblocks certifications } }' }),
          signal: AbortSignal.timeout(20000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status} from freeCodeCamp curriculum API`);
        payload = await response.json();
        break;
      } catch (error) {
        lastError = error;
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
      }
    }
    if (!payload) throw lastError ?? new Error('freeCodeCamp API request failed');
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
      deliveryMode: 'self_paced',
      coursePriceStatus: 'free',
      certificatePriceStatus: 'unknown',
      sourceData: { certification: name },
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
      subject: tag(item, 'category') || undefined,
      language: tag(item, 'language') || undefined,
      deliveryMode: 'online',
      coursePriceStatus: 'free',
      sourceData: { rssItem: item },
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
          deliveryMode: 'self_paced',
          coursePriceStatus: 'free',
          certificatePriceStatus: 'unavailable',
          sourceData: { sitemapUrl: loc },
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
const sourceDataJson = (value) => {
  const json = JSON.stringify(value ?? {});
  return json.length <= 10_000
    ? json
    : JSON.stringify({ truncated: true, originalLength: json.length, preview: json.slice(0, 9_000) });
};
const stmt = (sql, values) =>
  `${sql
    .replace(/\?/g, () => sqlValue(values.shift()))
    .trim()
    .replace(/;$/, '')};`;
const statements = [];
const sourceResults = [];
for (const source of sources) {
  const reviewedAt = now;
  statements.push(
    stmt(
      `INSERT INTO content_sources (id,slug,name,source_type,endpoint_url,terms_url,permission_class,attribution_text,enabled,restriction_flags_json,reviewed_at,created_at,updated_at) VALUES (?,?,?,'course_catalogue',?,?,'link_only',?,1,'{}',?,?,?) ON CONFLICT(id) DO UPDATE SET endpoint_url=excluded.endpoint_url,terms_url=excluded.terms_url,attribution_text=excluded.attribution_text,enabled=1,reviewed_at=excluded.reviewed_at,updated_at=excluded.updated_at`,
      [source.id, source.slug, source.name, source.endpoint, source.terms, source.attribution, reviewedAt, reviewedAt, reviewedAt],
    ),
  );
  let courses;
  try {
    courses = await getCourses(source);
  } catch (e) {
    const errorSummary = String(e).slice(0, 300);
    statements.push(
      stmt(
        `INSERT INTO ingestion_runs (id,source_id,content_type,trigger,started_at,finished_at,result,fetched_count,accepted_count,rejected_count,error_summary) VALUES (?,?,'courses',?,?,?,'failed',0,0,0,?)`,
        [
          `courses:${source.id}:${now}`,
          source.id,
          process.env.GITHUB_EVENT_NAME === 'schedule' ? 'scheduled' : 'manual',
          now,
          now,
          errorSummary,
        ],
      ),
    );
    sourceResults.push({
      sourceId: source.id,
      source: source.name,
      outcome: 'failed',
      fetchedCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      errorSummary,
    });
    continue;
  }
  const records = courses
    .map((c) => ({ ...c, url: c.url?.startsWith('http') ? c.url : '' }))
    .filter((c) => c.id && c.title && c.url);
  const unique = [...new Map(records.map((r) => [r.url, r])).values()];
  console.log(`${source.name}: fetched ${unique.length} course records; enriching provider pages`);
  if (!unique.length) {
    const errorSummary = 'provider returned no valid course records';
    statements.push(
      stmt(
        `INSERT INTO ingestion_runs (id,source_id,content_type,trigger,started_at,finished_at,result,fetched_count,accepted_count,rejected_count,error_summary) VALUES (?,?,'courses',?,?,?,'failed',?,?,?,?)`,
        [
          `courses:${source.id}:${now}`,
          source.id,
          process.env.GITHUB_EVENT_NAME === 'schedule' ? 'scheduled' : 'manual',
          now,
          now,
          courses.length,
          0,
          courses.length,
          errorSummary,
        ],
      ),
    );
    sourceResults.push({
      sourceId: source.id,
      source: source.name,
      outcome: 'failed',
      fetchedCount: courses.length,
      acceptedCount: 0,
      rejectedCount: courses.length,
      errorSummary,
    });
    continue;
  }
  const enriched = await mapConcurrent(unique, 12, enrichCourse, (completed, total) => {
    console.log(`${source.name}: enriched ${completed}/${total} course pages`);
  });
  console.log(`${source.name}: source metadata enrichment finished`);
  const runId = `courses:${source.id}:${now}`;
  for (const c of enriched) {
    const sourceRecordHash = createHash('sha256').update(String(c.id)).digest('hex');
    const courseSlug = `${slug(source.slug.replace(/-courses$/, '')).slice(0, 24)}-${slug(c.title).slice(0, 55)}-${sourceRecordHash.slice(0, 32)}`;
    const hash = `sha256:${createHash('sha256').update(JSON.stringify(c)).digest('hex')}`;
    statements.push(
      stmt(
        `INSERT INTO courses (id,source_id,source_record_id,canonical_url,enrolment_url,slug,title,provider,summary,subject,level,delivery_mode,language,duration,course_price_status,certificate_price_status,availability_status,first_seen_at,last_seen_at,permission_type,content_hash,created_at,updated_at,source_data_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(source_id,source_record_id) DO UPDATE SET canonical_url=excluded.canonical_url,enrolment_url=excluded.enrolment_url,slug=excluded.slug,title=excluded.title,provider=excluded.provider,summary=excluded.summary,subject=excluded.subject,level=excluded.level,delivery_mode=excluded.delivery_mode,language=excluded.language,duration=excluded.duration,course_price_status=excluded.course_price_status,certificate_price_status=excluded.certificate_price_status,last_seen_at=excluded.last_seen_at,availability_status='available',content_hash=excluded.content_hash,updated_at=excluded.updated_at,source_data_json=excluded.source_data_json`,
        [
          `${source.id}:${sourceRecordHash}`,
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
          c.deliveryMode || 'unknown',
          c.language || null,
          c.duration || null,
          c.coursePriceStatus || 'unknown',
          c.certificatePriceStatus || 'unknown',
          c.availabilityStatus || 'available',
          now,
          now,
          'link_only',
          hash,
          now,
          now,
          sourceDataJson(c.sourceData ?? c),
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
await writeFile(sqlPath, `${statements.join('\n')}\n`);
await writeFile(
  reportPath,
  `${JSON.stringify({ generatedAt: now, reportOnly: false, sourceResults, sqlPath }, null, 2)}\n`,
);
console.log(`course ingestion plan written: ${sqlPath}`);
