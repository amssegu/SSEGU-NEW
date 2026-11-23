import { getCollection, type CollectionEntry } from 'astro:content';
import { referenceId } from './content';

export interface Article {
  slug: string;
  title: string;
  description: string;
  category: string;
  categories: string[];
  tags: string[];
  author: string;
  publishedAt: string;
  updatedAt?: string;
  image: string;
  imageAlt?: string;
  imageFallback?: string;
  imageAvif: string;
  body: string[];
  featured?: boolean;
}

const defaultImage = '/uploads/article-ict.webp';
const defaultImageAvif = '/uploads/article-ict.avif';

export const categories = [
  'news',
  'business',
  'politics',
  'technology',
  'education',
  'lifestyle',
  'travel',
  'sports',
] as const;

const categorySignals: Record<string, string[]> = {
  business: [
    'business',
    'banking',
    'finance',
    'market',
    'money',
    'investment',
    'entrepreneur',
    'marketing',
    'startup',
    'commerce',
    'income',
    'economy',
    'economic',
    'bank',
  ],
  education: [
    'education',
    'school',
    'university',
    'student',
    'learning',
    'exam',
    'course',
    'certificate',
    'teacher',
    'teaching',
    'classroom',
    'scholarship',
  ],
  lifestyle: [
    'health',
    'mental',
    'wellness',
    'relationship',
    'recipe',
    'cooking',
    'food',
    'fashion',
    'beauty',
    'lifestyle',
    'music',
    'celebrity',
    'diy',
    'gardening',
  ],
  politics: [
    'parliament',
    'government',
    'president',
    'minister',
    'election',
    'politic',
    'policy',
    'court',
    'diplomatic',
    'war',
    'conflict',
  ],
  sports: [
    'football',
    'soccer',
    'premier league',
    'arsenal',
    'liverpool',
    'man city',
    'man utd',
    'cricket',
    'basketball',
    'boxing',
    'sports',
    'athlete',
  ],
  technology: [
    'technology',
    'tech',
    'software',
    'artificial intelligence',
    ' ai ',
    'cybersecurity',
    'blockchain',
    'python',
    'coding',
    'programming',
    'app ',
    'digital',
    'google',
    'microsoft',
    'apple',
    'nasa',
    'starlink',
    'telecom',
    'internet',
    'mobile',
    'phone',
    'gadget',
  ],
  travel: [
    'travel',
    'tourism',
    'tourist',
    'hotel',
    'resort',
    'itinerary',
    'destination',
    'vacation',
    'airport',
    'flight',
    'national park',
    'safari',
    'wildlife',
    'park',
  ],
};

const ignoredTags = new Set(['ssegu', 'bbc', 'facebook', 'twitter', 'youtube']);

function cleanText(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanArticleTitle(title: string) {
  return title.replace(/(?:\s*\|\s*ssegu)+$/gi, '').trim();
}

function extractEmbeddedTags(body: string) {
  const tagBlock =
    body.match(/<div[^>]+aria-label=["']Article tags["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? '';
  return [...tagBlock.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)]
    .map((match) => cleanText(match[1]))
    .filter(
      (tag) =>
        tag.length >= 2 &&
        tag.length <= 64 &&
        tag.split(/\s+/).length <= 8 &&
        !/[.!?]/.test(tag) &&
        !ignoredTags.has(tag.toLowerCase()),
    );
}

function articleTaxonomy(
  categoryRefs: unknown[],
  tags: unknown[],
  body: string,
  title: string,
  excerpt: string,
) {
  const suppliedCategory = categoryRefs
    .map(referenceId)
    .find((category): category is (typeof categories)[number] =>
      categories.includes(category as (typeof categories)[number]),
    );
  const suppliedTags = tags
    .map((tag) => cleanText(String(tag)))
    .filter((tag) => tag.length >= 2 && !ignoredTags.has(tag.toLowerCase()));
  const rawTags = [...suppliedTags, ...extractEmbeddedTags(body)];
  const articleTags = rawTags
    .filter(
      (tag, index) =>
        rawTags.findIndex((candidate) => candidate.toLowerCase() === tag.toLowerCase()) === index,
    )
    .slice(0, 3);
  const titleText = cleanText(`${title} ${excerpt}`).toLowerCase();
  const searchableText = ` ${cleanText(`${title} ${excerpt} ${articleTags.join(' ')} ${body.slice(0, 20000)}`).toLowerCase()} `;
  const ranked = Object.entries(categorySignals)
    .map(([category, signals]) => ({
      category,
      score: signals.reduce(
        (score, signal) =>
          score + (titleText.includes(signal) ? 3 : searchableText.includes(signal) ? 1 : 0),
        0,
      ),
    }))
    .filter((item) => item.score >= 2)
    .sort((a, b) => b.score - a.score || a.category.localeCompare(b.category));
  const primaryCategory = ranked[0]?.category ?? suppliedCategory ?? 'news';
  return { categories: [primaryCategory], tags: articleTags };
}

export function fromContentEntry(entry: CollectionEntry<'articles'>): Article {
  const date = entry.data.publishedAt.toISOString().slice(0, 10);
  const image = entry.data.image ?? defaultImage;
  const title = cleanArticleTitle(entry.data.title);
  const taxonomy = articleTaxonomy(
    entry.data.categories,
    entry.data.tags,
    entry.body ?? '',
    title,
    entry.data.excerpt,
  );
  return {
    slug: entry.data.slug,
    title,
    description: entry.data.metaDescription ?? entry.data.excerpt,
    category: taxonomy.categories[0],
    categories: taxonomy.categories,
    tags: taxonomy.tags,
    author:
      referenceId(entry.data.author) === 'editorial-desk'
        ? 'SSEGU Editorial Desk'
        : referenceId(entry.data.author),
    publishedAt: date,
    updatedAt: entry.data.updatedAt?.toISOString().slice(0, 10),
    image,
    imageAlt: entry.data.imageAlt,
    imageFallback: entry.data.imageFallback,
    imageAvif: image.endsWith('.avif')
      ? image
      : image.endsWith('.webp')
        ? image.replace(/\.webp$/, '.avif')
        : defaultImageAvif,
    body: [],
    featured: entry.data.featured,
  };
}

let cachedPublishedArticles: Article[] | undefined;

async function getAllPublishedArticles() {
  if (cachedPublishedArticles) return cachedPublishedArticles;
  const entries = (await getCollection('articles')).filter(
    ({ data }) => data.status === 'published',
  );
  const migrated = entries.map(fromContentEntry);
  cachedPublishedArticles = migrated.sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
  return cachedPublishedArticles;
}

export async function getPublishedArticles(category?: string) {
  const allArticles = await getAllPublishedArticles();
  return [...allArticles]
    .filter((article) => !category || article.categories.includes(category))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export const NEWS_PAGE_SIZE = 16;
export const CATEGORY_PAGE_SIZE = 9;

export function pageCount(total: number, pageSize = NEWS_PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function pageItems<T>(items: T[], page: number, pageSize = NEWS_PAGE_SIZE) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-UG', { dateStyle: 'medium' }).format(
    new Date(`${date}T12:00:00Z`),
  );
}
export function label(value: string) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
