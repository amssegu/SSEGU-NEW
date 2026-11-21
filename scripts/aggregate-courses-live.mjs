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
    id: 'freecodecamp-courses',
    slug: 'freecodecamp-courses',
    name: 'freeCodeCamp',
    endpoint: 'https://curriculum-db.freecodecamp.org/graphql',
    terms: 'https://opensource.freecodecamp.org/terms-of-service/',
    attribution: 'Course details link to freeCodeCamp. SSEGU is not affiliated with the provider.',
  },
  {
    id: 'microsoft-learn-courses',
    slug: 'microsoft-learn-courses',
    name: 'Microsoft Learn',
    endpoint: 'https://learn.microsoft.com/api/v1',
    terms: 'https://learn.microsoft.com/legal/microsoft-apis/terms-of-use',
    attribution: 'Course metadata via Microsoft Learn. Open the provider page for course details.',
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
const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
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
      summary:
        'Self-paced freeCodeCamp certification curriculum. Open the provider page for the current syllabus, projects, and assessment requirements.',
      sourceData: { certification: name, contentType: 'certification' },
    }));
  }
  if (source.id !== 'microsoft-learn-courses') throw new Error(`Unsupported course source: ${source.id}`);
  const accessToken = process.env.MICROSOFT_LEARN_ACCESS_TOKEN;
  if (!accessToken) throw new Error('MICROSOFT_LEARN_ACCESS_TOKEN is required for Microsoft Learn');
  const apiVersion = '2023-11-01-preview';
  const requestCatalog = async (path) => {
    let nextUrl = new URL(`${source.endpoint}/${path}`);
    nextUrl.searchParams.set('api-version', apiVersion);
    nextUrl.searchParams.set('locale', 'en-us');
    nextUrl.searchParams.set('maxpagesize', '100');
    const entries = [];
    for (let page = 0; nextUrl && page < 100; page += 1) {
      const response = await fetch(nextUrl, {
        headers: { accept: 'application/json', authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error(`Microsoft Learn ${path} returned HTTP ${response.status}`);
      const payload = await response.json();
      const rows = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.value)
          ? payload.value
          : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.items)
              ? payload.items
              : undefined;
      if (!rows) throw new Error(`Microsoft Learn ${path} response did not contain a catalog array`);
      entries.push(...rows);
      const continuation = payload?.nextLink ?? payload?.['@odata.nextLink'];
      nextUrl = typeof continuation === 'string' ? new URL(continuation) : null;
    }
    return entries;
  };
  const [paths, modules] = await Promise.all([
    requestCatalog('learning-paths'),
    requestCatalog('modules'),
  ]);
  const readable = (value) =>
    typeof value === 'string'
      ? decode(value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' '))
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 1_200)
      : '';
  const taxonomyNames = (value) =>
    Array.isArray(value)
      ? value.map((item) => (typeof item === 'object' ? readable(item?.name) : readable(item))).filter(Boolean)
      : [];
  return [...paths, ...modules]
    .filter((item) => item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.url === 'string')
    .map((item) => ({
      id: item.id,
      title: readable(item.title),
      url: item.url,
      summary: readable(item.summary),
      subject: taxonomyNames(item.subjects)[0] || taxonomyNames(item.products)[0] || 'Technology',
      level: taxonomyNames(item.levels)[0] || undefined,
      language: readable(item.locale) || 'en-us',
      duration:
        Number.isFinite(item.durationInMinutes) && item.durationInMinutes > 0
          ? item.durationInMinutes < 60
            ? `${item.durationInMinutes} minutes`
            : `${Math.floor(item.durationInMinutes / 60)} hours${item.durationInMinutes % 60 ? ` ${item.durationInMinutes % 60} minutes` : ''}`
          : undefined,
      deliveryMode: 'self_paced',
      coursePriceStatus: 'free',
      certificatePriceStatus: 'unknown',
      sourceData: {
        contentType: item.type,
        roles: taxonomyNames(item.roles),
        products: taxonomyNames(item.products),
        units: Array.isArray(item.units) ? item.units.length : undefined,
        modules: Array.isArray(item.modules) ? item.modules.length : undefined,
        updatedAt: item.updatedAt,
      },
    }));
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
statements.push(`UPDATE content_sources SET enabled = 0, updated_at = '${now.replaceAll("'", "''")}' WHERE id IN ('mit-ocw-courses', 'openlearn-courses');`);
statements.push("DELETE FROM courses WHERE source_id IN ('mit-ocw-courses','openlearn-courses');");
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
  console.log(`${source.name}: fetched ${unique.length} source catalog records`);
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
  const enriched = unique;
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
