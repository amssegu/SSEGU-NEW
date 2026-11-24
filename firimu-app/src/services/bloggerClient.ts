import {
  parseBloggerPage,
  parseBloggerPost,
  type RawBloggerEntry,
} from '../utils/bloggerParser';
import type { BloggerPageItem, CatalogResponse, MovieItem } from '../types/movie';

const BLOGGER_ORIGIN = 'https://vj.ssegu.com';
const API_BASE = '/firimu/api';

interface BloggerJsonpResponse {
  feed?: {
    openSearch$totalResults?: { $t?: string };
    entry?: RawBloggerEntry[];
  };
}

function loadBloggerJsonp(url: string, timeoutMs = 15000): Promise<BloggerJsonpResponse> {
  return new Promise((resolve, reject) => {
    const callbackName = `sseguBloggerCb_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement('script');
    const win = window as unknown as Record<string, unknown>;

    const cleanup = () => {
      delete win[callbackName];
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('Blogger JSONP request timed out'));
    }, timeoutMs);

    win[callbackName] = (data: BloggerJsonpResponse) => {
      window.clearTimeout(timer);
      cleanup();
      resolve(data);
    };

    script.src = `${url}&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => {
      window.clearTimeout(timer);
      cleanup();
      reject(new Error('Failed to load Blogger JSONP feed'));
    };

    document.head.appendChild(script);
  });
}

async function fetchCatalogViaJsonp(): Promise<CatalogResponse> {
  const maxPerPage = 150;
  let startIndex = 1;
  let totalExpected = Infinity;
  const allEntries: RawBloggerEntry[] = [];

  while (startIndex <= totalExpected && startIndex <= 3000) {
    const url = `${BLOGGER_ORIGIN}/feeds/posts/default?alt=json-in-script&start-index=${startIndex}&max-results=${maxPerPage}`;
    const data = await loadBloggerJsonp(url);
    const totalStr = data.feed?.openSearch$totalResults?.$t;
    if (totalStr && Number.isFinite(Number(totalStr))) {
      totalExpected = Number(totalStr);
    }
    const entries = data.feed?.entry || [];
    if (entries.length === 0) break;
    allEntries.push(...entries);
    if (entries.length < maxPerPage) break;
    startIndex += entries.length;
  }

  const seen = new Set<string>();
  const movies: MovieItem[] = [];
  for (const entry of allEntries) {
    const parsed = parseBloggerPost(entry);
    if (parsed && !seen.has(parsed.path)) {
      seen.add(parsed.path);
      movies.push(parsed);
    }
  }

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

  return {
    movies,
    total: movies.length,
    categories: Array.from(genreCounts.values()).sort((a, b) => b.count - a.count),
    vjs: Array.from(vjCounts.values()).sort((a, b) => b.count - a.count),
    syncedAt: new Date().toISOString(),
    source: BLOGGER_ORIGIN,
  };
}

async function fetchPagesViaJsonp(): Promise<BloggerPageItem[]> {
  const url = `${BLOGGER_ORIGIN}/feeds/pages/default?alt=json-in-script&max-results=50`;
  const data = await loadBloggerJsonp(url);
  return (data.feed?.entry || [])
    .map((entry) => parseBloggerPage(entry))
    .filter((p): p is BloggerPageItem => p !== null);
}

export async function fetchCatalog(forceRefresh = false): Promise<CatalogResponse> {
  try {
    const endpoint = `${API_BASE}/movies${forceRefresh ? '?refresh=1' : ''}`;
    const res = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = (await res.json()) as CatalogResponse;
      if (Array.isArray(data.movies)) {
        return data;
      }
    }
  } catch {
    // Fall back to direct Blogger JSONP feed (static hosting compatibility)
  }

  return fetchCatalogViaJsonp();
}

export async function fetchStaticPages(): Promise<BloggerPageItem[]> {
  try {
    const res = await fetch(`${API_BASE}/pages`, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = (await res.json()) as { pages?: BloggerPageItem[] };
      if (Array.isArray(data.pages)) {
        return data.pages;
      }
    }
  } catch {
    // Fall back to direct Blogger JSONP feed
  }

  return fetchPagesViaJsonp();
}
