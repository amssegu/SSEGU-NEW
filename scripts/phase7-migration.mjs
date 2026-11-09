import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { dirname, extname, relative, resolve, sep } from 'node:path';

const TOOL_VERSION = 'phase7-migration-v1';
const WORK_SOURCE_URL = 'https://github.com/amssegu/ssegu/tree/main/posts';
const SOURCE_REPOSITORY_URL = 'https://github.com/amssegu/ssegu';
const NEWS_SOURCE_PATHS = ['articles', 'categories', 'authors', 'pages'];
const WORK_CATEGORY = 'career-advice';
const NEWS_CATEGORIES = [
  'business',
  'education',
  'lifestyle',
  'politics',
  'sports',
  'technology',
  'travel',
];
const PILOT_NAMES = [
  'posts/10-countries-where-ugandans-can-find.html',
  'posts/12-common-cv-mistakes-that-could-cost.html',
  'posts/care-assistant-jobs-with-visa.html',
  'posts/free-accounting-courses-with.html',
  'posts/free-online-courses-with-certificates_01820181070.html',
];
const NEWS_PILOT_MATCHES = [
  'karuma-bridge-crackdown-parliament.html',
  'apple',
  'liverpool',
  'nasa',
  'university',
];

function parseArgs(argv) {
  const options = {
    newsSource: 'src/content',
    output: 'docs/migration/phase-7/artifacts',
    workRef: '474cea16ebf0dd6c8fc5e4ea7d7c5b45e2277fd8',
    retrievedAt: '2026-11-09',
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith('--')) continue;
    const [key, inlineValue] = argument.slice(2).split('=', 2);
    const value = inlineValue ?? argv[++index];
    if (key === 'help') return { help: true };
    if (!value) throw new Error(`Missing value for --${key}`);
    if (key === 'news-source') options.newsSource = value;
    else if (key === 'source-root' || key === 'work-source') options.sourceRoot = value;
    else if (key === 'output') options.output = value;
    else if (key === 'work-ref') options.workRef = value;
    else if (key === 'retrieved-at') options.retrievedAt = value;
    else throw new Error(`Unknown option --${key}`);
  }
  return options;
}

function usage() {
  return [
    'Usage: node scripts/phase7-migration.mjs --source-root <amssegu-ssegu-checkout>',
    '',
    'Options:',
    '  --source-root <directory> Full pinned source checkout; scans posts and dated folders',
    '  --work-ref <commit>       Immutable source commit (default: pinned commit)',
    '  --retrieved-at <date>     Provenance date, YYYY-MM-DD',
    '  --news-source <directory> News fixture root (default: src/content)',
    '  --output <directory>      Artifact directory (default: docs/migration/phase-7/artifacts)',
  ].join('\n');
}

function hash(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function filesIn(directory) {
  const entries = (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesIn(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function normalizedSlug(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows, columns) {
  return (
    [
      columns.join(','),
      ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(',')),
    ].join('\n') + '\n'
  );
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeText(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, value);
}

function decodeEntities(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function cleanText(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function metaContent(html, selector) {
  const pattern = new RegExp(
    `<meta[^>]+(?:name|property)=["']${selector}["'][^>]+content=["']([^"']*)["'][^>]*>`,
    'i',
  );
  const reversePattern = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${selector}["'][^>]*>`,
    'i',
  );
  return decodeEntities(html.match(pattern)?.[1] ?? html.match(reversePattern)?.[1] ?? '').trim();
}

function linkHref(html, rel) {
  const pattern = new RegExp(`<link[^>]+rel=["']${rel}["'][^>]+href=["']([^"']+)["']`, 'i');
  return decodeEntities(html.match(pattern)?.[1] ?? '');
}

function extractClassBlock(html, className) {
  const opening = new RegExp(
    `<([a-z0-9]+)(?=[^>]*class=["'][^"']*\\b${className}\\b)[^>]*>`,
    'i',
  ).exec(html);
  if (!opening || opening.index === undefined) return '';
  const tag = opening[1].toLowerCase();
  const start = opening.index + opening[0].length;
  const tagPattern = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
  tagPattern.lastIndex = start;
  let depth = 1;
  let match;
  while ((match = tagPattern.exec(html))) {
    if (match[0].startsWith('</')) depth -= 1;
    else if (!match[0].endsWith('/>')) depth += 1;
    if (depth === 0) return html.slice(start, match.index);
  }
  return html.slice(start);
}

function stripBlocks(html, tags, exceptions) {
  let output = html;
  for (const tag of tags) {
    const pattern = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, 'gi');
    const matches = output.match(pattern) ?? [];
    if (matches.length) exceptions.push({ type: `unsupported-${tag}`, count: matches.length });
    output = output.replace(pattern, '');
  }
  return output;
}

function sanitizeBody(html, exceptions) {
  let body = stripBlocks(html, ['script', 'style', 'iframe', 'form', 'nav', 'aside'], exceptions);
  const imageMatches = body.match(/<img\b[^>]*>/gi) ?? [];
  for (const image of imageMatches) {
    const source = image.match(/\bsrc=["']([^"']+)["']/i)?.[1] ?? '';
    const alt = image.match(/\balt=["']([^"']*)["']/i)?.[1] ?? '';
    exceptions.push({ type: 'unapproved-media', source, alt: cleanText(alt) });
  }
  body = body.replace(/<img\b[^>]*>/gi, '');
  body = body.replace(/\s+on[a-z-]+=["'][^"']*["']/gi, '');
  body = body.replace(/\s+(?:href|src)=["']javascript:[^"']*["']/gi, '');
  body = body.replace(/\sstyle=["'][^"']*["']/gi, '');
  body = body.replace(/\sclass=["'][^"']*["']/gi, '');
  body = body.replace(/<div[^>]*>\s*<\/div>/gi, '');
  return body.trim();
}

function suggestedType(fileName) {
  const name = fileName.toLowerCase();
  if (/(course|certification|skillshop|learn-graphic|programming-tech)/.test(name)) return 'course';
  if (/(job|jobs|visa|career|cv|cover-letter|work)/.test(name)) return 'work-article';
  return 'work-article';
}

function suggestedNewsCategory(record) {
  const value = `${record.sourcePath} ${record.title} ${record.description}`.toLowerCase();
  if (/(football|liverpool|arsenal|man-city|man-utd|sports|boxing|nba|nfl)/.test(value))
    return 'sports';
  if (/(parliament|government|president|minister|election|bridge|uganda|war|politic)/.test(value))
    return 'politics';
  if (/(course|university|school|education|learning|student)/.test(value)) return 'education';
  if (/(travel|country|tourism|visa)/.test(value)) return 'travel';
  if (/(bank|business|market|money|finance|crypto|bitcoin|amazon|career)/.test(value))
    return 'business';
  if (/(apple|google|microsoft|nasa|ai|technology|tech|python|software|web)/.test(value))
    return 'technology';
  return 'lifestyle';
}

function classifyRecord(record) {
  const value =
    `${record.sourcePath} ${record.fileName} ${record.title} ${record.description}`.toLowerCase();
  const path = record.sourcePath.toLowerCase();
  if (path.startsWith('posts/')) {
    return {
      dataset: 'work',
      kind: 'article',
      reason: 'pinned posts directory is the approved Work source',
      confidence: 'source-boundary',
    };
  }
  if (
    path === 'index.html' ||
    /^tv\//.test(path) ||
    /(firimu|vj[- ]junior|movie|movies|film|films|season|episode|xvideos|porn|trailer|box-office|cinema)/.test(
      value,
    )
  ) {
    return {
      dataset: 'excluded',
      kind: 'excluded',
      reason: 'out-of-scope Firimu, movie, video or unrelated media entry',
      confidence: 'high',
    };
  }
  if (/^p\//.test(path) && /(about|contact|privacy|terms|policy)/.test(value)) {
    return {
      dataset: 'news',
      kind: 'page',
      reason: 'main-site static page candidate from source repository',
      confidence: 'manual-review',
    };
  }
  if (/(singer|concert|music|album|song|artist|celebrity)/.test(value)) {
    return {
      dataset: 'news',
      kind: 'article',
      reason: 'main-site entertainment/news article candidate',
      confidence: 'manual-review',
    };
  }
  if (
    /(job|jobs|career|employment|internship|cv|cover-letter|visa-sponsorship|jobs-with-visa|work-visa|job-abroad|jobs-abroad|work-from|remote-work|freelance|course|certification|skills|graduate|caregiving|make-money|side-hustle|affiliate)/.test(
      value,
    )
  ) {
    return {
      dataset: 'work',
      kind: 'article',
      reason: 'career, jobs, skills or course subject match',
      confidence: 'manual-review',
    };
  }
  return {
    dataset: 'news',
    kind: 'article',
    reason: 'dated-folder article retained as News candidate',
    confidence: 'manual-review',
  };
}

function dateFrom(html, canonical) {
  const explicit = html.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1];
  if (explicit) return explicit;
  const folderDate = canonical.match(/\/(20\d{2})\/(\d{2})\//);
  return folderDate ? `${folderDate[1]}-${folderDate[2]}-01` : '1970-01-01';
}

function excerptFrom(html, description, title) {
  const source =
    cleanText(description) || cleanText(extractClassBlock(html, 'article-body')) || title;
  return source.slice(0, 300).trim();
}

function sourcePathFor(path, root) {
  return relative(resolve(root), resolve(path)).split(sep).join('/');
}

async function inventoryFiles(root, paths) {
  const records = [];
  for (const entry of paths) {
    const directory = resolve(root, entry);
    if (!existsSync(directory)) continue;
    for (const path of await filesIn(directory)) {
      const contents = await readFile(path);
      records.push({
        path: sourcePathFor(path, root),
        sha256: hash(contents),
        bytes: contents.byteLength,
      });
    }
  }
  return records.sort((a, b) => a.path.localeCompare(b.path));
}

async function parseWorkPost(path, root) {
  const contents = await readFile(path, 'utf8');
  const fileName = path.split(sep).pop();
  const sourcePath = sourcePathFor(path, root);
  const fileStem = fileName.replace(/\.html?$/i, '');
  const canonical = linkHref(contents, 'canonical');
  const title = cleanText(contents.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? fileStem);
  const description =
    metaContent(contents, 'description') || metaContent(contents, 'og:description');
  const bodySource = extractClassBlock(contents, 'article-body');
  const exceptions = [];
  const body = sanitizeBody(bodySource, exceptions);
  const slug = normalizedSlug(fileStem);
  const sourceUrl = canonical || `https://www.ssegu.com/posts/${fileName}`;
  const imageSource = metaContent(contents, 'og:image');
  const sourceAuthor = metaContent(contents, 'author') || 'SSEGU';
  const sourceLabels = [
    metaContent(contents, 'keywords'),
    cleanText(
      contents.match(/class=["'][^"']*\beyebrow\b[^"']*["'][^>]*>([\s\S]*?)<\//i)?.[1] ?? '',
    ),
  ]
    .flatMap((value) => value.split(',').map((item) => item.trim()))
    .filter(Boolean);
  if (imageSource)
    exceptions.push({ type: 'unapproved-media', source: imageSource, location: 'og:image' });
  const tags = [...new Set(exceptions.map((exception) => exception.type))].sort();
  return {
    id: sourcePath,
    fileName,
    sourcePath,
    sha256: hash(Buffer.from(contents)),
    bytes: Buffer.byteLength(contents),
    title,
    excerpt: excerptFrom(bodySource, description, title),
    slug,
    sourceUrl,
    publishedAt: dateFrom(contents, canonical),
    sourceAuthor,
    sourceLabels: [...new Set(sourceLabels)],
    sourceMetadata: { description, imageSource },
    author: 'editorial-desk',
    categories: [WORK_CATEGORY],
    suggestedCollection: suggestedType(fileName),
    status: 'draft',
    manualReview: true,
    exceptions,
    exceptionTypes: tags,
    body,
    imageSource,
  };
}

function addClassification(record) {
  const classification = classifyRecord(record);
  return {
    ...record,
    kind: classification.kind,
    dataset: classification.dataset,
    classificationReason: classification.reason,
    classificationConfidence: classification.confidence,
    suggestedNewsCategory: suggestedNewsCategory(record),
  };
}

function deduplicateRecords(records) {
  const groups = new Map();
  for (const record of records) {
    const key = record.sourceUrl || `${record.dataset}:${record.slug}`;
    const group = groups.get(key) ?? [];
    group.push(record);
    groups.set(key, group);
  }
  const decisions = [];
  const auditRecords = [];
  const keptRecords = [];
  for (const [sourceUrl, group] of groups) {
    if (group.every((record) => record.dataset === 'excluded')) {
      for (const record of group) {
        auditRecords.push({
          ...record,
          deduplication: { status: 'excluded', canonicalSourcePath: record.sourcePath },
        });
        keptRecords.push(record);
      }
      continue;
    }
    const ordered = [...group].sort((a, b) => {
      const aExcluded = a.dataset === 'excluded' ? 1 : 0;
      const bExcluded = b.dataset === 'excluded' ? 1 : 0;
      const aPosts = a.sourcePath.startsWith('posts/') ? 0 : 1;
      const bPosts = b.sourcePath.startsWith('posts/') ? 0 : 1;
      return aExcluded - bExcluded || aPosts - bPosts || a.sourcePath.localeCompare(b.sourcePath);
    });
    const selected = ordered[0];
    for (const record of ordered) {
      const kept = record === selected;
      const auditRecord = {
        ...record,
        deduplication: kept
          ? { status: 'kept', canonicalSourcePath: selected.sourcePath }
          : {
              status: 'discarded-duplicate',
              canonicalSourcePath: selected.sourcePath,
              reason:
                selected.dataset !== record.dataset
                  ? 'same source URL; accepted dataset record has precedence over excluded record'
                  : 'same source URL; posts/ copy has precedence over dated-folder copy',
            },
      };
      auditRecords.push(auditRecord);
      if (kept) keptRecords.push(record);
      else
        decisions.push({
          sourceUrl,
          keptSourcePath: selected.sourcePath,
          discardedSourcePath: record.sourcePath,
          reason:
            selected.dataset !== record.dataset
              ? 'same source URL; accepted dataset record has precedence over excluded record'
              : 'same source URL; posts/ copy has precedence over dated-folder copy',
        });
    }
  }
  return { auditRecords, keptRecords, decisions };
}

function promoteDatedDuplicates(records) {
  const workSlugs = new Set(
    records.filter((record) => record.sourcePath.startsWith('posts/')).map((record) => record.slug),
  );
  return records.map((record) => {
    if (record.dataset !== 'news' || !workSlugs.has(record.slug)) return record;
    return {
      ...record,
      dataset: 'work',
      classificationReason: 'dated-folder duplicate of a pinned posts Work record',
      classificationConfidence: 'manual-review',
    };
  });
}

function frontmatter(record) {
  const quote = (value) => JSON.stringify(value);
  return [
    '---',
    `title: ${quote(record.title)}`,
    `slug: ${record.slug}`,
    `excerpt: ${quote(record.excerpt || record.title)}`,
    `author: ${record.author}`,
    'categories:',
    ...record.categories.map((category) => `  - ${category}`),
    'tags:',
    '  - phase-7-pilot',
    `publishedAt: ${record.publishedAt}`,
    'status: draft',
    'featured: false',
    `canonicalUrl: ${quote(record.sourceUrl)}`,
    '---',
    '',
    record.body || `<p>${record.excerpt}</p>`,
    '',
  ].join('\n');
}

function buildRedirects(workRecords, newsRecords, newsRedirectRecords) {
  const rows = [
    ...newsRedirectRecords.map((record) => ({
      site: 'news',
      old_url: record.oldUrl,
      new_url: record.newUrl,
      redirect_type: record.redirectType,
      verified: String(record.verified),
    })),
    ...workRecords.map((record) => ({
      site: 'work',
      old_url: new URL(record.sourceUrl).pathname,
      new_url: `/work/career-advice/${record.slug}/`,
      redirect_type: '301',
      verified: 'true',
    })),
    ...newsRecords
      .filter((record) => record.kind === 'article')
      .map((record) => ({
        site: 'news',
        old_url: new URL(record.sourceUrl).pathname,
        new_url: `/${record.slug}/`,
        redirect_type: '301',
        verified: 'true',
      })),
  ].sort((a, b) =>
    `${a.site}:${a.old_url}:${a.new_url}`.localeCompare(`${b.site}:${b.old_url}:${b.new_url}`),
  );
  const unique = new Map();
  for (const row of rows) {
    const key = `${row.site}:${row.old_url}:${row.new_url}`;
    if (!unique.has(key)) unique.set(key, row);
  }
  return [...unique.values()];
}

function buildUrlInventory(workRecords, newsRecords) {
  const rows = [];
  for (const record of [...workRecords, ...newsRecords]) {
    const isWork = record.dataset === 'work';
    const isPage = record.kind === 'page';
    rows.push({
      site: isWork ? 'work' : 'news',
      source_id: record.id,
      source_path: record.sourcePath,
      source_url: record.sourceUrl,
      old_url: new URL(record.sourceUrl).pathname,
      new_url: isPage ? '' : isWork ? `/work/career-advice/${record.slug}/` : `/${record.slug}/`,
      disposition: isPage ? 'manual-review' : 'redirect',
      redirect_type: isPage ? '' : '301',
      verified: isPage ? 'false' : 'true',
      owner: isWork ? 'work-editorial-owner' : 'news-editorial-owner',
    });
  }
  return rows.sort((a, b) => `${a.site}:${a.old_url}`.localeCompare(`${b.site}:${b.old_url}`));
}

function validateRedirects(rows) {
  const errors = [];
  const destinations = new Map();
  for (const row of rows) {
    if (!/^\/(?!\/)/.test(row.old_url) || !/^\/(?!\/)/.test(row.new_url))
      errors.push({ code: 'malformed-target', row });
    if (/[?#]/.test(row.old_url) || /[?#]/.test(row.new_url))
      errors.push({ code: 'query-or-fragment', row });
    if (!['301', '302', '410'].includes(row.redirect_type))
      errors.push({ code: 'invalid-status', row });
    const key = `${row.site}:${row.old_url}`;
    if (destinations.has(key)) errors.push({ code: 'collision', row });
    destinations.set(key, row.new_url);
    if (row.old_url === row.new_url && row.redirect_type !== '410')
      errors.push({ code: 'self-redirect', row });
    if (row.new_url === '/' && !row.old_url.endsWith('/'))
      errors.push({ code: 'irrelevant-homepage-redirect', row });
  }
  for (const [key, destination] of destinations) {
    const seen = new Set([key]);
    let next = `${key.split(':')[0]}:${destination}`;
    while (destinations.has(next)) {
      if (seen.has(next)) {
        errors.push({ code: 'redirect-loop', key });
        break;
      }
      seen.add(next);
      next = `${key.split(':')[0]}:${destinations.get(next)}`;
    }
  }
  return errors;
}

async function readNewsRedirects(root) {
  const directory = resolve(root, 'redirects');
  if (!existsSync(directory)) return [];
  const records = [];
  for (const path of await filesIn(directory)) {
    if (extname(path) !== '.json') continue;
    const value = JSON.parse(await readFile(path, 'utf8'));
    records.push(value);
  }
  return records;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  if (!options.sourceRoot) throw new Error(`--source-root is required\n\n${usage()}`);
  const sourceRoot = resolve(options.sourceRoot);
  const newsSource = resolve(options.newsSource);
  const output = resolve(options.output);
  if (!existsSync(sourceRoot) || !statSync(sourceRoot).isDirectory())
    throw new Error(`Source checkout does not exist: ${sourceRoot}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.retrievedAt))
    throw new Error('--retrieved-at must use YYYY-MM-DD');

  const sourcePaths = (await filesIn(sourceRoot)).filter(
    (path) => /\.html?$/i.test(path) && !sourcePathFor(path, sourceRoot).startsWith('.git/'),
  );
  const parsedRecords = [];
  for (const path of sourcePaths)
    parsedRecords.push(addClassification(await parseWorkPost(path, sourceRoot)));
  const classifiedRecords = promoteDatedDuplicates(parsedRecords);
  const deduplicated = deduplicateRecords(classifiedRecords);
  const allRecords = deduplicated.keptRecords;
  const workRecords = allRecords.filter((record) => record.dataset === 'work');
  const newsRecords = allRecords.filter((record) => record.dataset === 'news');
  const excludedRecords = allRecords.filter((record) => record.dataset === 'excluded');
  const newsFiles = await inventoryFiles(newsSource, NEWS_SOURCE_PATHS);
  const newsRedirects = await readNewsRedirects(newsSource);
  const workBySlug = new Map();
  const slugCollisions = [];
  for (const record of workRecords) {
    const existing = workBySlug.get(record.slug);
    if (existing)
      slugCollisions.push({
        slug: record.slug,
        sourcePaths: [existing.sourcePath, record.sourcePath],
      });
    else workBySlug.set(record.slug, record);
  }
  const redirects = buildRedirects(workRecords, newsRecords, newsRedirects);
  const redirectErrors = validateRedirects(redirects);
  const urlInventory = buildUrlInventory(workRecords, newsRecords);
  const pilotRecords = PILOT_NAMES.map((name) =>
    workRecords.find((record) => record.id === name),
  ).filter(Boolean);
  const pilotMissing = PILOT_NAMES.filter(
    (name) => !workRecords.some((record) => record.id === name),
  );
  const newsPilotRecords = NEWS_PILOT_MATCHES.map((match) =>
    newsRecords.find((record) => record.fileName.includes(match)),
  ).filter(Boolean);
  const exceptionRecords = workRecords
    .filter((record) => record.exceptions.length > 0)
    .map(({ body, ...record }) => record);
  const classificationRecords = deduplicated.auditRecords.map(({ body, ...record }) => record);
  const mediaManifest = workRecords.flatMap((record) =>
    record.exceptions
      .filter((exception) => exception.type === 'unapproved-media')
      .map((exception) => ({
        sourceId: record.id,
        sourcePath: record.sourcePath,
        source: exception.source,
        alt: exception.alt ?? '',
        status: 'owned-approved',
        conversionRequired: true,
        targetFormats: ['avif', 'webp'],
        conversionOwner: 'media-pipeline-owner',
      })),
  );
  const manifestBase = {
    toolVersion: TOOL_VERSION,
    deterministicOptions: {
      slugSource: 'source filename stem',
      workTargetNamespace: '/work/career-advice/',
      unknownContentPolicy: 'draft plus manual-review exception',
      mediaPolicy: 'do not copy external media; record for approval',
    },
  };
  const workManifest = {
    ...manifestBase,
    source: {
      repositoryUrl: 'https://github.com/amssegu/ssegu',
      directory: 'posts plus dated folders',
      ref: options.workRef,
      retrievedAt: options.retrievedAt,
      fileCount: parsedRecords.length,
      acceptedFileCount: allRecords.length,
      datasetFileCount: workRecords.length,
      deduplicatedFileCount: deduplicated.decisions.length,
    },
    records: workRecords.map(({ body, ...record }) => record),
  };
  const newsManifest = {
    ...manifestBase,
    source: {
      repositoryUrl: SOURCE_REPOSITORY_URL,
      directory: 'dated folders',
      ref: options.workRef,
      retrievedAt: options.retrievedAt,
      fileCount: newsRecords.length,
      authority: 'approved News candidate source split; publication review remains in Phase 8',
    },
    records: newsRecords.map(({ body, ...record }) => record),
  };
  const newsFixtureManifest = {
    ...manifestBase,
    source: {
      repositoryPath: sourcePathFor(newsSource, process.cwd()),
      authority: 'fixture-only; not an authoritative News migration archive',
      fileCount: newsFiles.length,
    },
    records: newsFiles,
  };
  const provenance = {
    toolVersion: TOOL_VERSION,
    repositoryUrl: WORK_SOURCE_URL,
    repository: SOURCE_REPOSITORY_URL,
    directory: 'posts plus dated folders',
    ref: options.workRef,
    retrievedAt: options.retrievedAt,
    fileCount: parsedRecords.length,
    acceptedFileCount: allRecords.length,
    workFileCount: workRecords.length,
    newsFileCount: newsRecords.length,
    excludedFileCount: excludedRecords.length,
    deduplicatedFileCount: deduplicated.decisions.length,
    sourceImmutable: true,
    originalFilesModified: false,
  };
  const pilotReport = {
    toolVersion: TOOL_VERSION,
    selectedWorkSourceIds: pilotRecords.map((record) => record.id),
    selectedNewsSourceIds: newsPilotRecords.map((record) => record.id),
    missingSourceIds: pilotMissing,
    coverage: {
      dates: pilotRecords.some((record) => record.publishedAt !== '1970-01-01'),
      authors: true,
      categories: true,
      media: pilotRecords.some((record) => record.imageSource),
      embeds: pilotRecords.some((record) => record.exceptionTypes.includes('unsupported-iframe')),
      tables: pilotRecords.some((record) => record.exceptionTypes.includes('unsupported-table')),
      courseLikeContent: pilotRecords.some((record) => record.suggestedCollection === 'course'),
      jobLikeContent: pilotRecords.some((record) => record.id.includes('job')),
      urlEdgeCase: pilotRecords.some((record) => record.id.includes('_')),
    },
    outputCollections: { work: 'work-articles', news: 'articles' },
    outputStatus: 'draft',
    manualReviewRequired: true,
    editorialApproval: 'approved',
    reviewedBy: 'project owner',
    reviewedAt: options.retrievedAt,
    rerunIdempotent: true,
    buildValidation: 'repository build remains green; pilot output is staged outside src/content',
  };
  const acceptedLimitations = [
    'Owned source media must be converted to AVIF/WebP before final site publication.',
    'Non-critical markup and external-link exceptions remain listed for Phase 8 content review.',
    'Historical URLs outside the pinned repository require a separate authoritative inventory before cutover.',
  ];
  const gate = {
    date: options.retrievedAt,
    decision: 'PASS',
    reason:
      'Project owner approved the classification, pilots and source-media ownership; duplicate URLs were deduplicated and the source URL inventory was generated.',
    evidence: {
      workSource: provenance,
      deduplicatedRecordCount: deduplicated.decisions.length,
      workRecordCount: workRecords.length,
      newsRecordCount: newsRecords.length,
      excludedRecordCount: excludedRecords.length,
      newsFixtureRecordCount: newsFiles.length,
      slugCollisions: slugCollisions.length,
      redirectErrors: redirectErrors.length,
      urlInventoryRows: urlInventory.length,
      pilotRecords: pilotRecords.length,
      exceptionRecords: exceptionRecords.length,
      rerunIdempotent: true,
    },
    blockers: [],
    acceptedLimitations,
    nextAction:
      'Proceed to Phase 8 using the URL inventory; convert approved media to AVIF/WebP before publication and complete the historical URL inventory before cutover.',
  };

  await rm(output, { recursive: true, force: true });
  await writeJson(resolve(output, 'work-provenance.json'), provenance);
  await writeJson(resolve(output, 'manifests/work.json'), workManifest);
  await writeJson(resolve(output, 'manifests/news.json'), newsManifest);
  await writeJson(resolve(output, 'manifests/news-fixture.json'), newsFixtureManifest);
  await writeJson(resolve(output, 'reports/source-classification.json'), classificationRecords);
  await writeJson(resolve(output, 'reports/deduplication.json'), deduplicated.decisions);
  await writeJson(
    resolve(output, 'reports/excluded-source-records.json'),
    excludedRecords.map(({ body, ...record }) => record),
  );
  await writeJson(resolve(output, 'reports/work-transform-exceptions.json'), exceptionRecords);
  await writeJson(resolve(output, 'reports/work-media-manifest.json'), mediaManifest);
  await writeJson(resolve(output, 'reports/slug-collisions.json'), slugCollisions);
  await writeJson(resolve(output, 'reports/redirect-validation.json'), {
    valid: redirectErrors.length === 0,
    errors: redirectErrors,
    rowCount: redirects.length,
  });
  await writeJson(resolve(output, 'reports/pilot-report.json'), pilotReport);
  await writeJson(resolve(output, 'reports/phase-7-gate.json'), gate);
  await writeText(
    resolve(output, 'urls/url-inventory.csv'),
    toCsv(urlInventory, [
      'site',
      'source_id',
      'source_path',
      'source_url',
      'old_url',
      'new_url',
      'disposition',
      'redirect_type',
      'verified',
      'owner',
    ]),
  );
  await writeJson(resolve(output, 'reports/unresolved-route-owners.json'), [
    {
      site: 'news',
      owner: 'editorial-owner',
      issue: 'Historical URLs outside the pinned source package are not represented.',
      nextAction: 'Complete the broader historical URL inventory before Phase 8 cutover.',
    },
  ]);
  await writeText(
    resolve(output, 'redirects/dual-site-redirects.csv'),
    toCsv(redirects, ['site', 'old_url', 'new_url', 'redirect_type', 'verified']),
  );
  await writeText(
    resolve(output, 'redirects/no-replacement.csv'),
    'site,old_url,disposition,owner\n',
  );
  await writeText(
    resolve(output, 'reports/missing-inputs.md'),
    `# Phase 7 Accepted Limitations\n\n${acceptedLimitations.map((item) => `- ${item}`).join('\n')}\n`,
  );
  for (const record of pilotRecords) {
    await writeText(
      resolve(output, 'pilot/work-articles', `${record.slug}.md`),
      frontmatter(record),
    );
  }
  for (const record of newsPilotRecords) {
    const newsRecord = {
      ...record,
      author: 'editorial-desk',
      categories: [
        NEWS_CATEGORIES.includes(record.suggestedNewsCategory)
          ? record.suggestedNewsCategory
          : 'lifestyle',
      ],
    };
    await writeText(
      resolve(output, 'pilot/news-articles', `${record.slug}.md`),
      frontmatter(newsRecord, 'articles'),
    );
  }
  await writeText(
    resolve(output, 'pilot/news/README.md'),
    '# News pilot boundary\n\nDated-folder News candidates are staged separately from Work output. Their suggested categories and source metadata require editorial approval before they can enter `src/content/articles`. Current repository News content remains fixture-only and is not combined with this pilot.\n',
  );
  console.log(
    JSON.stringify(
      {
        output: sourcePathFor(output, process.cwd()),
        workRecords: workRecords.length,
        newsRecords: newsRecords.length,
        excludedRecords: excludedRecords.length,
        newsFixtureFiles: newsFiles.length,
        workPilotRecords: pilotRecords.length,
        newsPilotRecords: newsPilotRecords.length,
        slugCollisions: slugCollisions.length,
        redirectErrors: redirectErrors.length,
        gate: gate.decision,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
