import { createHash } from 'node:crypto';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const contentRoots = [
  resolve(root, 'src/content/articles'),
  resolve(root, 'src/content/work-articles'),
];
const outputRoot = resolve(root, 'public/uploads/migrated');
const reportPath = resolve(root, 'docs/migration/phase-8/artifacts/reports/media-migration.json');
const imageUrlPattern = /https?:\/\/[^\s"'<>]+/g;

function cleanUrl(value) {
  return value.replace(/[),.;]+$/g, '');
}

function isImageUrl(value) {
  try {
    const url = new URL(value);
    return (
      /\.(?:jpe?g|png|webp|gif)(?:$|[?#])/i.test(url.pathname) ||
      url.hostname === 'blogger.googleusercontent.com'
    );
  } catch {
    return false;
  }
}

function imageUrls(body) {
  return [...new Set((body.match(imageUrlPattern) ?? []).map(cleanUrl).filter(isImageUrl))];
}

function titleFrom(frontmatter, fallback) {
  const value = frontmatter.match(/^title:\s*(.+)$/m)?.[1]?.trim();
  return (value ?? fallback).replace(/^['"]|['"]$/g, '').replace(/''/g, "'");
}

function htmlAttribute(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function insertImageFields(frontmatter, image, alt) {
  const lines = frontmatter.split('\n');
  const fields = [`image: ${JSON.stringify(image)}`, `imageAlt: ${JSON.stringify(alt)}`];
  for (const key of ['image', 'imageAlt']) {
    const index = lines.findIndex((line) => line.startsWith(`${key}:`));
    if (index >= 0) lines.splice(index, 1);
  }
  const statusIndex = lines.findIndex((line) => line.startsWith('status:'));
  lines.splice(statusIndex >= 0 ? statusIndex + 1 : lines.length, 0, ...fields);
  return lines.join('\n');
}

async function contentFiles() {
  const files = [];
  for (const directory of contentRoots) {
    for (const name of await readdir(directory)) {
      if (name.endsWith('.md')) files.push(join(directory, name));
    }
  }
  return files.sort();
}

async function convert(url) {
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 16);
  const webp = `/uploads/migrated/${hash}.webp`;
  const avif = `/uploads/migrated/${hash}.avif`;
  const webpPath = resolve(root, `public${webp}`);
  const avifPath = resolve(root, `public${avif}`);
  try {
    const response = await fetch(url, {
      headers: { 'user-agent': 'SSEGU-media-migration/1.0' },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const input = Buffer.from(await response.arrayBuffer());
    const pipeline = sharp(input)
      .rotate()
      .resize({ width: 1600, height: 900, fit: 'inside', withoutEnlargement: true });
    await Promise.all([
      pipeline.clone().webp({ quality: 82 }).toFile(webpPath),
      pipeline.clone().avif({ quality: 58, effort: 4 }).toFile(avifPath),
    ]);
    return { url, webp, avif, bytes: input.byteLength };
  } catch (error) {
    return { url, error: error instanceof Error ? error.message : String(error) };
  }
}

await mkdir(outputRoot, { recursive: true });
const files = await contentFiles();
const assets = new Map();
const assetPromises = new Map();
let updatedFiles = 0;
let externalFallbackFiles = 0;

async function getAsset(url) {
  if (!assetPromises.has(url)) assetPromises.set(url, convert(url));
  const asset = await assetPromises.get(url);
  assets.set(url, asset);
  return asset;
}

let cursor = 0;
async function worker() {
  while (cursor < files.length) {
    const file = files[cursor++];
    const source = await readFile(file, 'utf8');
    const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) continue;
    const [, frontmatter, body] = match;
    const candidates = imageUrls(body);
    if (!candidates.length || /^image:\s*\/uploads\/migrated\//m.test(frontmatter)) {
      continue;
    }
    const asset = await getAsset(candidates[0]);
    const image = asset.error ? asset.url : asset.webp;
    if (asset.error) {
      externalFallbackFiles += 1;
    }
    const title = titleFrom(frontmatter, file.split('/').pop().replace(/\.md$/, ''));
    const alt = `Illustration for ${title}`;
    let migratedBody = body;
    for (const url of candidates) {
      const replacement = assets.get(url);
      if (replacement)
        migratedBody = migratedBody.replaceAll(
          url,
          replacement.error ? replacement.url : replacement.webp,
        );
    }
    migratedBody = migratedBody.replace(
      /<a\s+href=(['"])(\/uploads\/migrated\/[^'"]+)\1[^>]*>\s*<\/a>/gi,
      (...args) => `<img src="${args[2]}" alt="${htmlAttribute(alt)}" loading="lazy" />`,
    );
    const next = `---\n${insertImageFields(frontmatter, image, alt)}\n---\n${migratedBody}`;
    await writeFile(file, next);
    updatedFiles += 1;
  }
}

await Promise.all(Array.from({ length: 8 }, () => worker()));

const finalMediaCounts = { localImageFiles: 0, externalImageFiles: 0, filesWithoutImage: 0 };
for (const file of files) {
  const source = await readFile(file, 'utf8');
  const image = source.match(/^image:\s*["']?([^"'\n]+)["']?$/m)?.[1] ?? '';
  if (image.startsWith('/uploads/migrated/')) finalMediaCounts.localImageFiles += 1;
  else if (/^https?:\/\//.test(image)) finalMediaCounts.externalImageFiles += 1;
  else finalMediaCounts.filesWithoutImage += 1;
}
const localAssetFiles = (await readdir(outputRoot)).filter((name) =>
  /\.(?:avif|webp)$/i.test(name),
);
const failures = [...assets.values()].filter((asset) => asset.error);
const report = {
  generatedAt: new Date().toISOString().slice(0, 10),
  ownership: 'project-owner-confirmed-owned',
  policy: 'approved source media may be copied and transformed for SSEGU publication',
  sourceImageUrls: assets.size,
  convertedImageUrls: assets.size - failures.length,
  failedImageUrls: failures.length,
  updatedContentFiles: updatedFiles,
  localAssetFiles: localAssetFiles.length,
  localImageFiles: finalMediaCounts.localImageFiles,
  externalImageFiles: finalMediaCounts.externalImageFiles,
  contentFilesWithoutUsableImage: finalMediaCounts.filesWithoutImage,
  externalUrlFallbackFiles: externalFallbackFiles,
  formats: ['avif', 'webp'],
  outputDirectory: '/uploads/migrated/',
  failures,
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
