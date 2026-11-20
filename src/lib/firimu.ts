import { getCollection, type CollectionEntry } from 'astro:content';
import { fromContentEntry, type Article } from './articles';
import rawPosterSeeds from '../data/firimu-posters.json';

const posterSeeds = rawPosterSeeds as Record<string, { poster: string }>;

export type FirimuEntry = CollectionEntry<'articles'>;

export interface FirimuItem {
  article: Article;
  entry: FirimuEntry;
  vj: string;
  genre: string;
  runtime?: string;
  plot: string;
  videoSources: string[];
  poster: string;
}

let firimuItemsPromise: Promise<FirimuItem[]> | undefined;

function cleanText(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normaliseValue(value: string) {
  return cleanText(value)
    .replace(/[|•]+.*$/g, '')
    .trim();
}

function firstMatch(text: string, pattern: RegExp) {
  return normaliseValue(text.match(pattern)?.[1] ?? '');
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function createPoster(title: string, vj: string, genre: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675"><rect width="1200" height="675" fill="#080a0e"/><circle cx="980" cy="90" r="260" fill="#e88b5f" opacity=".18"/><circle cx="170" cy="640" r="300" fill="#4e6b8a" opacity=".2"/><path d="M0 500 1200 220V675H0Z" fill="#111c28" opacity=".85"/><text x="72" y="104" fill="#e88b5f" font-family="Arial,sans-serif" font-size="24" font-weight="700" letter-spacing="5">SSEGU FIRIMU</text><text x="72" y="390" fill="#f5f2ec" font-family="Arial,sans-serif" font-size="64" font-weight="700">${escapeXml(title.slice(0, 30))}</text><text x="72" y="452" fill="#aeb8c4" font-family="Arial,sans-serif" font-size="26">${escapeXml(vj)} · ${escapeXml(genre)}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function extractVjs(text: string) {
  return unique(
    [...text.matchAll(/\bVJ(?:\s+[A-Za-z][A-Za-z0-9'’-]*){1,4}/gi)].map((match) =>
      normaliseValue(match[0]),
    ),
  ).slice(0, 2);
}

function extractVideoSources(body: string) {
  const sourceUrls = [...body.matchAll(/<source[^>]+src=["']([^"']+)["']/gi)].map((match) =>
    decodeHtml(match[1]),
  );
  const videoUrls = [...body.matchAll(/<video[^>]+src=["']([^"']+)["']/gi)].map((match) =>
    decodeHtml(match[1]),
  );
  return unique([...sourceUrls, ...videoUrls]).filter((url) => /^https?:\/\//i.test(url));
}

function extractPostPoster(body: string) {
  const videoPosters = [...body.matchAll(/<video[^>]+poster=["']([^"']+)["']/gi)].map((match) =>
    decodeHtml(match[1]),
  );
  const imageSources = [...body.matchAll(/<(?:img|a)[^>]+(?:src|href)=["']([^"']+)["']/gi)].map(
    (match) => decodeHtml(match[1]),
  );
  return [...videoPosters, ...imageSources].find(
    (url) => /^https?:\/\//i.test(url) && /\.(?:avif|gif|jpe?g|png|webp)(?:[?#]|$)/i.test(url),
  );
}

export function isFirimuEntry(entry: FirimuEntry) {
  const searchable = [
    entry.data.title,
    entry.data.slug,
    entry.data.excerpt,
    ...entry.data.tags,
    entry.body ?? '',
  ].join(' ');
  return /\bVJ\b/i.test(searchable);
}

async function toFirimuItem(entry: FirimuEntry): Promise<FirimuItem> {
  const article = fromContentEntry(entry);
  const body = entry.body ?? '';
  const searchable = `${entry.data.title} ${entry.data.excerpt} ${body}`;
  const vjs = extractVjs(searchable);
  const genre = firstMatch(searchable, /genre\s*:\s*([^<\n]+)/i) || 'Film';
  const runtime = firstMatch(searchable, /runtime\s*:\s*([^<\n]+)/i) || undefined;
  const plot =
    firstMatch(searchable, /plot\s*:\s*([\s\S]*?)(?=<\/p>|<div|runtime\s*:|$)/i) ||
    article.description;
  const poster =
    posterSeeds[entry.data.slug]?.poster ||
    extractPostPoster(body) ||
    entry.data.image ||
    createPoster(article.title, vjs[0] ?? 'SSEGU Firimu', genre);

  return {
    article,
    entry,
    vj: vjs[0] ?? 'SSEGU Firimu',
    genre,
    runtime,
    plot,
    videoSources: extractVideoSources(body),
    poster,
  };
}

export async function getFirimuItems() {
  if (!firimuItemsPromise) {
    firimuItemsPromise = (async () => {
      const entries = (await getCollection('articles'))
        .filter(({ data }) => data.status === 'published')
        .filter(isFirimuEntry)
        .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());

      const items: FirimuItem[] = [];
      for (const entry of entries) {
        const item = await toFirimuItem(entry);
        if (item.videoSources.length > 0) items.push(item);
      }
      return items;
    })();
  }

  return firimuItemsPromise;
}
