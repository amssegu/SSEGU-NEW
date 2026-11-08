import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse as parseYaml } from 'yaml';

const root = process.cwd();
const contentRoot = join(root, 'src/content');
const collectionNames = [
  'articles',
  'categories',
  'work-categories',
  'authors',
  'pages',
  'jobs',
  'internships',
  'work-articles',
  'courses',
  'employers',
  'navigation',
  'site-settings',
  'redirects',
];
const contentCollections = new Map();
const errors = [];

function addError(code, file, message, target = errors) {
  target.push(`${code} | ${file} | ${message}`);
}

function filesIn(directory) {
  if (!statSafe(directory)) return [];
  return readdirSync(directory)
    .sort()
    .flatMap((name) => {
      const path = join(directory, name);
      return statSync(path).isDirectory() ? filesIn(path) : [path];
    });
}

function statSafe(path) {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}

function parseEntry(path) {
  const source = readFileSync(path, 'utf8');
  if (path.endsWith('.json')) return JSON.parse(source);
  const match = source.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/);
  if (!match) throw new Error('missing YAML frontmatter');
  return parseYaml(match[1]);
}

function validateCommon(data, file, collection, target = errors) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    addError('invalid-record', file, 'record must be an object', target);
    return;
  }
  if ('slug' in data && (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug) || !data.slug)) {
    addError('invalid-slug', file, 'slug must be lowercase URL-safe text', target);
  }
  if (
    ['articles', 'pages', 'jobs', 'internships', 'work-articles', 'courses'].includes(collection)
  ) {
    if (!['draft', 'published', 'expired'].includes(data.status)) {
      addError('invalid-status', file, 'status must be draft, published or expired', target);
    }
  }
  if (data.image && (!data.imageAlt || !String(data.imageAlt).trim())) {
    addError('image-alt', file, 'imageAlt is required when image is supplied', target);
  }
}

function validateApplication(data, file, target = errors) {
  const fields = {
    'external-url': 'applicationUrl',
    email: 'applicationEmail',
    instructions: 'applicationInstructions',
  };
  if (!fields[data.applicationMethod]) {
    addError('application-method', file, 'applicationMethod is invalid', target);
  } else if (!data[fields[data.applicationMethod]]) {
    addError('application-detail', file, `${fields[data.applicationMethod]} is required`, target);
  }
  if (!data.sourceUrl) addError('source-url', file, 'sourceUrl is required', target);
  if (!data.verificationNote)
    addError('verification-note', file, 'verificationNote is required', target);
}

for (const collection of collectionNames) {
  const directory = join(contentRoot, collection);
  const entries = [];
  for (const file of filesIn(directory).filter((path) => /\.(json|md)$/.test(path))) {
    const displayFile = relative(root, file);
    try {
      const data = parseEntry(file);
      entries.push({
        file,
        displayFile,
        id: file
          .split('/')
          .pop()
          .replace(/\.(json|md)$/, ''),
        data,
      });
      validateCommon(data, displayFile, collection);
      if (['jobs', 'internships'].includes(collection)) validateApplication(data, displayFile);
      if (collection === 'articles' && data.section === 'work') {
        addError(
          'section-boundary',
          displayFile,
          'Work records cannot enter the News articles collection',
        );
      }
      if (collection === 'work-articles' && data.section === 'news') {
        addError(
          'section-boundary',
          displayFile,
          'News records cannot enter the Work articles collection',
        );
      }
    } catch (error) {
      addError('parse-error', displayFile, error instanceof Error ? error.message : String(error));
    }
  }
  contentCollections.set(collection, entries);

  const ids = new Set();
  const slugs = new Set();
  for (const entry of entries) {
    if (ids.has(entry.id))
      addError('duplicate-id', entry.displayFile, `duplicate entry id ${entry.id}`);
    ids.add(entry.id);
    if (entry.data?.slug) {
      if (slugs.has(entry.data.slug))
        addError(
          'duplicate-slug',
          entry.displayFile,
          `duplicate ${collection} slug ${entry.data.slug}`,
        );
      slugs.add(entry.data.slug);
      if (entry.id !== entry.data.slug) {
        addError('unstable-id', entry.displayFile, `filename must match slug ${entry.data.slug}`);
      }
    }
  }
}

function hasId(collection, id) {
  return contentCollections.get(collection)?.some((entry) => entry.id === id);
}

for (const entry of contentCollections.get('articles') ?? []) {
  if (!hasId('authors', entry.data.author))
    addError('unknown-author', entry.displayFile, `unknown author ${entry.data.author}`);
  for (const category of entry.data.categories ?? []) {
    if (!hasId('categories', category))
      addError('unknown-category', entry.displayFile, `unknown category ${category}`);
  }
}
for (const entry of contentCollections.get('work-articles') ?? []) {
  if (!hasId('authors', entry.data.author))
    addError('unknown-author', entry.displayFile, `unknown author ${entry.data.author}`);
  for (const category of entry.data.categories ?? []) {
    if (!hasId('work-categories', category))
      addError('unknown-work-category', entry.displayFile, `unknown Work category ${category}`);
  }
}
for (const collection of ['jobs', 'internships']) {
  for (const entry of contentCollections.get(collection) ?? []) {
    if (!hasId('employers', entry.data.employer))
      addError('unknown-employer', entry.displayFile, `unknown employer ${entry.data.employer}`);
  }
}

const csv = readFileSync(join(root, 'project-spec/sample-article-metadata.csv'), 'utf8').trim();
const rows = csv.split('\n').slice(1);
assert.equal(rows.length, 35, 'Expected 35 fixture metadata rows');
assert.ok(rows.every((row) => row.endsWith(',fixture,article-placeholder.svg')));

const cmsConfig = parseYaml(readFileSync(join(root, 'public/admin/config.yml'), 'utf8'));
assert.equal(cmsConfig.backend?.name, 'github', 'Decap must use the GitHub backend');
assert.equal(
  cmsConfig.publish_mode,
  'editorial_workflow',
  'Draft privacy requires editorial workflow',
);
assert.equal(
  cmsConfig.media_folder,
  'public/uploads',
  'CMS media must stay in the approved repository folder',
);
assert.deepEqual(
  cmsConfig.collections?.map((collection) => collection.name).sort(),
  [
    'articles',
    'authors',
    'categories',
    'courses',
    'employers',
    'internships',
    'jobs',
    'navigation',
    'pages',
    'redirects',
    'site_settings',
    'work_articles',
    'work_categories',
  ].sort(),
  'Decap collections must cover the Phase 5 model',
);
assert.match(readFileSync(join(root, 'public/admin/index.html'), 'utf8'), /noindex, nofollow/);

const invalidFixtures = [
  [
    'project-spec/content-fixtures/invalid/news-work-mix.json',
    ['section-boundary', 'unknown-author', 'unknown-category'],
  ],
  ['project-spec/content-fixtures/invalid/job-application.json', ['application-detail']],
  ['project-spec/content-fixtures/invalid/missing-image-alt.json', ['image-alt']],
];
for (const [file, expectedCodes] of invalidFixtures) {
  const data = JSON.parse(readFileSync(join(root, file), 'utf8'));
  const invalidErrors = [];
  validateCommon(data, file, data.collection, invalidErrors);
  if (['jobs', 'internships'].includes(data.collection))
    validateApplication(data, file, invalidErrors);
  if (data.collection === 'articles' && data.section === 'work') {
    addError(
      'section-boundary',
      file,
      'Work records cannot enter the News articles collection',
      invalidErrors,
    );
  }
  if (data.collection === 'articles') {
    if (!hasId('authors', data.author))
      addError('unknown-author', file, `unknown author ${data.author}`, invalidErrors);
    for (const category of data.categories ?? []) {
      if (!hasId('categories', category))
        addError('unknown-category', file, `unknown category ${category}`, invalidErrors);
    }
  }
  const found = invalidErrors.map((error) => error.split(' | ')[0]);
  for (const code of expectedCodes)
    assert.ok(found.includes(code), `${file} should produce ${code}`);
}

if (errors.length) {
  console.error([...new Set(errors)].sort().join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `content validation passed: ${contentCollections.size} collections, ${rows.length} legacy fixture rows`,
  );
}
