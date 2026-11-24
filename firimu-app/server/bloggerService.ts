import {
  parseBloggerPage,
  parseBloggerPost,
  type RawBloggerEntry,
} from '../src/utils/bloggerParser.ts';
import type { BloggerPageItem, CatalogResponse, MovieItem } from '../src/types/movie.ts';

const BLOGGER_ORIGIN = 'https://vj.ssegu.com';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface BloggerFeedJson {
  feed?: {
    openSearch$totalResults?: { $t?: string };
    entry?: RawBloggerEntry[];
  };
}

let cachedCatalog: CatalogResponse | null = null;
let lastCatalogFetch = 0;
let inFlightCatalogPromise: Promise<CatalogResponse> | null = null;

let cachedPages: BloggerPageItem[] | null = null;
let lastPagesFetch = 0;

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SseguMoviesFirimu/1.0 (+https://ssegu.com/firimu/)',
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Upstream HTTP ${response.status} from Blogger`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchAllBloggerMovies(forceRefresh = false): Promise<CatalogResponse> {
  const now = Date.now();
  if (!forceRefresh && cachedCatalog && now - lastCatalogFetch < CACHE_TTL_MS) {
    return cachedCatalog;
  }

  if (inFlightCatalogPromise) {
    return inFlightCatalogPromise;
  }

  inFlightCatalogPromise = (async () => {
    const maxPerPage = 150;
    let startIndex = 1;
    let totalExpected = Infinity;
    const allEntries: RawBloggerEntry[] = [];

    while (startIndex <= totalExpected && startIndex <= 3000) {
      const feedUrl = `${BLOGGER_ORIGIN}/feeds/posts/default?alt=json&start-index=${startIndex}&max-results=${maxPerPage}`;
      const json = await fetchJsonWithTimeout<BloggerFeedJson>(feedUrl);
      const totalStr = json.feed?.openSearch$totalResults?.$t;
      if (totalStr && Number.isFinite(Number(totalStr))) {
        totalExpected = Number(totalStr);
      }
      const entries = json.feed?.entry || [];
      if (entries.length === 0) break;
      allEntries.push(...entries);
      if (entries.length < maxPerPage) break;
      startIndex += entries.length;
    }

    const seenPaths = new Set<string>();
    const movies: MovieItem[] = [];
    for (const entry of allEntries) {
      const parsed = parseBloggerPost(entry);
      if (parsed && !seenPaths.has(parsed.path)) {
        seenPaths.add(parsed.path);
        movies.push(parsed);
      }
    }

    // Build category and VJ index counts
    const genreCounts = new Map<string, { label: string; slug: string; count: number }>();
    const vjCounts = new Map<string, { label: string; slug: string; count: number }>();

    for (const movie of movies) {
      for (const cat of movie.categories) {
        const lower = cat.toLowerCase();
        if (
          ['action', 'adventure', 'scifi', 'comedy', 'crime', 'horror', 'animation-fantasy', 'series'].includes(
            lower
          )
        ) {
          const existing = genreCounts.get(lower);
          if (existing) {
            existing.count += 1;
          } else {
            genreCounts.set(lower, {
              slug: lower,
              label:
                lower === 'scifi'
                  ? 'Sci-Fi'
                  : lower === 'animation-fantasy'
                    ? 'Animation & Fantasy'
                    : lower.charAt(0).toUpperCase() + lower.slice(1),
              count: 1,
            });
          }
        }
      }

      if (movie.vjSlug && movie.vjSlug !== 'ssegu-vj') {
        const existingVj = vjCounts.get(movie.vjSlug);
        if (existingVj) {
          existingVj.count += 1;
        } else {
          vjCounts.set(movie.vjSlug, {
            slug: movie.vjSlug,
            label: movie.vj,
            count: 1,
          });
        }
      }
    }

    const result: CatalogResponse = {
      movies,
      total: movies.length,
      categories: Array.from(genreCounts.values()).sort((a, b) => b.count - a.count),
      vjs: Array.from(vjCounts.values()).sort((a, b) => b.count - a.count),
      syncedAt: new Date().toISOString(),
      source: BLOGGER_ORIGIN,
    };

    cachedCatalog = result;
    lastCatalogFetch = Date.now();
    return result;
  })();

  try {
    return await inFlightCatalogPromise;
  } catch (err) {
    if (cachedCatalog) {
      return cachedCatalog;
    }
    throw err;
  } finally {
    inFlightCatalogPromise = null;
  }
}

export async function fetchAllBloggerPages(forceRefresh = false): Promise<BloggerPageItem[]> {
  const now = Date.now();
  if (!forceRefresh && cachedPages && now - lastPagesFetch < CACHE_TTL_MS * 6) {
    return cachedPages;
  }

  try {
    const feedUrl = `${BLOGGER_ORIGIN}/feeds/pages/default?alt=json&max-results=50`;
    const json = await fetchJsonWithTimeout<BloggerFeedJson>(feedUrl);
    const pages = (json.feed?.entry || [])
      .map((entry) => parseBloggerPage(entry))
      .filter((p): p is BloggerPageItem => p !== null);

    cachedPages = pages;
    lastPagesFetch = Date.now();
    return pages;
  } catch (err) {
    if (cachedPages) return cachedPages;
    throw err;
  }
}

export function buildSitemapXml(movies: MovieItem[], pages: BloggerPageItem[], origin = 'https://ssegu.com'): string {
  const base = `${origin.replace(/\/$/, '')}/firimu`;
  const urls: Array<{ loc: string; lastmod?: string; priority: string; changefreq: string }> = [
    { loc: `${base}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${base}/search`, priority: '0.7', changefreq: 'weekly' },
  ];

  const categorySlugs = [
    'action',
    'adventure',
    'scifi',
    'comedy',
    'crime',
    'horror',
    'animation-fantasy',
    'series',
    'vj-junior',
    'vj-emmy',
    'vj-mark',
    'vj-kevo',
    'vj-jingo',
    'vj-muba',
    'vj-ulio',
  ];

  for (const slug of categorySlugs) {
    urls.push({
      loc: `${base}/search/label/${slug}`,
      priority: '0.8',
      changefreq: 'daily',
    });
  }

  for (const page of pages) {
    urls.push({
      loc: `${base}${page.path}`,
      lastmod: page.updated ? page.updated.slice(0, 10) : undefined,
      priority: '0.5',
      changefreq: 'monthly',
    });
  }

  for (const movie of movies) {
    urls.push({
      loc: `${base}${movie.path}`,
      lastmod: (movie.updated || movie.published).slice(0, 10),
      priority: '0.9',
      changefreq: 'weekly',
    });
  }

  const escapeXml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const items = urls
    .map(
      (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>`;
}

export function buildRobotsTxt(origin = 'https://ssegu.com'): string {
  const base = `${origin.replace(/\/$/, '')}/firimu`;
  return `User-agent: *
Allow: /firimu/
Disallow: /firimu/api/

Sitemap: ${base}/sitemap.xml
`;
}
