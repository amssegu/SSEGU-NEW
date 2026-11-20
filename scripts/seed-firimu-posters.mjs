import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const articlesDirectory = join(process.cwd(), 'src/content/articles');
const posterDirectory = join(process.cwd(), 'public/uploads/firimu/posters');
const posterManifestPath = join(process.cwd(), 'src/data/firimu-posters.json');
const commonsApi = 'https://commons.wikimedia.org/w/api.php';
const userAgent = 'SSEGU-Firimu-PosterSeeder/1.0 (https://ssegu.com/)';

function decodeHtml(value = '') {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalise(value) {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b\d{4}\b/g, ' ')
    .replace(/\b(the|a|an|film|movie|poster|cover|official)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function movieTitle(title) {
  return title
    .replace(/\s*\|\s*SSEGU.*$/i, '')
    .replace(/\s+Kali\s+Mu\s*:\s*VJ.*$/i, '')
    .replace(/\s+-\s*VJ.*$/i, '')
    .replace(/\s+VJ(?:\s+[A-Za-z][A-Za-z0-9'’-]*){1,4}(?:\s+SSEGU(?:\s+\d+)?)?$/i, '')
    .replace(/\s+SSEGU(?:\s+\d+)?$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function articleValue(source, key) {
  return source.match(new RegExp(`^${key}:\\s*['\"]?([^'\\"\\n]+)`, 'mi'))?.[1]?.trim() ?? '';
}

async function extractArticles(files) {
  const items = await Promise.all(
    files
      .filter((file) => file.endsWith('.md'))
      .map(async (file) => {
        const source = await readFile(join(articlesDirectory, file), 'utf8');
        const title = articleValue(source, 'title');
        const slug = articleValue(source, 'slug');
        const searchable = `${title} ${slug} ${source}`;
        if (!/\bVJ\b/i.test(searchable) || !/<(?:video|source)\b/i.test(source)) return undefined;
        return {
          title,
          slug,
          movieTitle: movieTitle(title),
          year: source.match(/release\s+year\s*:\s*(\d{4})/i)?.[1],
        };
      }),
  );
  return items.filter(Boolean);
}

async function request(params) {
  const url = new URL(commonsApi);
  Object.entries({ ...params, format: 'json', origin: '*' }).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );
  const response = await fetch(url, { headers: { 'User-Agent': userAgent } });
  if (!response.ok) throw new Error(`Commons API returned ${response.status}`);
  return response.json();
}

function licenseInfo(metadata = {}) {
  const license = decodeHtml(metadata.LicenseShortName?.value ?? metadata.UsageTerms?.value ?? '');
  const licenseUrl = decodeHtml(metadata.LicenseUrl?.value ?? '');
  const allowed =
    /creative commons|cc[- ]?(?:by|by[- ]?sa|0)|public domain|free art|gfdl|art libre/i.test(
      license,
    );
  return allowed ? { license, licenseUrl } : undefined;
}

function candidateScore(query, title) {
  const wanted = normalise(query);
  const found = normalise(title);
  if (!wanted || !found) return 0;
  if (wanted === found) return 100;
  if (wanted.split(' ').length >= 2 && found.includes(wanted)) return 90;
  return 0;
}

async function findPoster(item) {
  const search = await request({
    action: 'query',
    list: 'search',
    srnamespace: '6',
    srlimit: '20',
    srsearch: `${item.movieTitle} film poster filetype:bitmap`,
  });
  const pages = search.query?.search ?? [];
  if (!pages.length) return undefined;

  const details = await request({
    action: 'query',
    pageids: pages.map((page) => page.pageid).join('|'),
    prop: 'imageinfo',
    iiprop: 'url|mime|size|extmetadata',
    iiurlwidth: '780',
  });
  const candidates = Object.values(details.query?.pages ?? {})
    .map((page) => {
      const info = page.imageinfo?.[0];
      const license = licenseInfo(info?.extmetadata);
      return {
        page,
        info,
        license,
        score: candidateScore(item.movieTitle, page.title?.replace(/^File:/i, '') ?? ''),
      };
    })
    .filter((candidate) => candidate.info?.thumburl && candidate.license && candidate.score >= 55)
    .sort((a, b) => b.score - a.score);

  const selected = candidates[0];
  if (!selected) return undefined;
  const info = selected.info;
  const page = selected.page;
  const metadata = info.extmetadata ?? {};
  const mimeExtension = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[
    info.mime
  ];
  if (!mimeExtension) return undefined;

  const imageResponse = await fetch(info.thumburl, { headers: { 'User-Agent': userAgent } });
  if (!imageResponse.ok) return undefined;
  const filename = `${item.slug}${mimeExtension}`;
  await writeFile(join(posterDirectory, filename), Buffer.from(await imageResponse.arrayBuffer()));

  return {
    poster: `/uploads/firimu/posters/${filename}`,
    sourcePage: `https://commons.wikimedia.org/?curid=${page.pageid}`,
    sourceTitle: page.title,
    license: selected.license.license,
    licenseUrl: selected.license.licenseUrl,
    artist: decodeHtml(metadata.Artist?.value ?? ''),
    credit: decodeHtml(metadata.Credit?.value ?? ''),
  };
}

await rm(posterDirectory, { recursive: true, force: true });
await mkdir(posterDirectory, { recursive: true });
const files = await readdir(articlesDirectory);
const articles = await extractArticles(files);
const manifest = {};
let matched = 0;

for (const item of articles) {
  try {
    const poster = await findPoster(item);
    if (poster) {
      manifest[item.slug] = { title: item.title, ...poster };
      matched += 1;
      console.log(`seeded ${item.movieTitle}`);
    } else {
      console.log(`no licensed poster found for ${item.movieTitle}`);
    }
  } catch (error) {
    console.warn(`skipped ${item.movieTitle}: ${error.message}`);
  }
}

await writeFile(posterManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Firimu poster seed complete: ${matched}/${articles.length} licensed posters`);
