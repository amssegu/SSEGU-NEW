import { copyFile, mkdir, readdir, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const artifactRoot = resolve(
  process.argv.find((argument) => argument.startsWith('--artifact-root='))?.slice(16) ??
    'docs/migration/phase-8/artifacts',
);

async function records(name) {
  return JSON.parse(await readFile(resolve(artifactRoot, `manifests/${name}.json`), 'utf8'))
    .records;
}

async function promote(collection, sourceDirectory, sourceRecords) {
  const destination = resolve(root, 'src/content', collection);
  await mkdir(destination, { recursive: true });
  const names = new Set(sourceRecords.map((record) => `${record.slug}.md`));
  for (const entry of await readdir(destination)) {
    if (names.has(entry) || (collection === 'articles' && entry === '404.md'))
      await rm(resolve(destination, entry), { force: true });
  }
  for (const record of sourceRecords) {
    await copyFile(
      resolve(artifactRoot, sourceDirectory, `${record.slug}.md`),
      resolve(destination, `${record.slug}.md`),
    );
  }
  return sourceRecords.length;
}

const work = await records('work');
const news = (await records('news')).filter((record) => record.kind === 'article');
const workCount = await promote('work-articles', 'full/work-articles', work);
const newsCount = await promote('articles', 'full/news-articles', news);
console.log(JSON.stringify({ news: newsCount, work: workCount, status: 'published' }, null, 2));
