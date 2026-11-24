import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCatalog, fetchStaticPages } from '../services/bloggerClient';
import type { BloggerPageItem, CatalogResponse, MovieItem } from '../types/movie';

interface CatalogContextValue {
  movies: MovieItem[];
  pages: BloggerPageItem[];
  categories: CatalogResponse['categories'];
  vjs: CatalogResponse['vjs'];
  loading: boolean;
  error: string | null;
  syncedAt: string | null;
  refreshCatalog: () => Promise<void>;
  findMovieByPath: (path: string) => MovieItem | undefined;
  findPageByPath: (path: string) => BloggerPageItem | undefined;
  filterMovies: (opts: { q?: string; label?: string }) => MovieItem[];
  recentlyWatched: MovieItem[];
  markWatched: (movie: MovieItem) => void;
}

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);
const WATCHED_STORAGE_KEY = 'ssegu_firimu_recent_v1';

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [pages, setPages] = useState<BloggerPageItem[]>([]);
  const [categories, setCategories] = useState<CatalogResponse['categories']>([]);
  const [vjs, setVjs] = useState<CatalogResponse['vjs']>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(WATCHED_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const loadData = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const [catalogData, pagesData] = await Promise.all([
        fetchCatalog(force),
        fetchStaticPages().catch(() => [] as BloggerPageItem[]),
      ]);
      setMovies(catalogData.movies);
      setCategories(catalogData.categories);
      setVjs(catalogData.vjs);
      setSyncedAt(catalogData.syncedAt);
      if (pagesData.length > 0) {
        setPages(pagesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the movie catalogue right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  const refreshCatalog = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  const findMovieByPath = useCallback(
    (rawPath: string) => {
      const normalized = rawPath.replace(/^\/firimu/, '');
      return movies.find((m) => m.path === normalized || m.path === `${normalized}.html`);
    },
    [movies]
  );

  const findPageByPath = useCallback(
    (rawPath: string) => {
      const normalized = rawPath.replace(/^\/firimu/, '');
      if (normalized === '/p/about.html') {
        return pages.find((p) => p.path === '/p/about-us.html' || p.path === '/p/about.html');
      }
      return pages.find((p) => p.path === normalized);
    },
    [pages]
  );

  const filterMovies = useCallback(
    ({ q = '', label = '' }: { q?: string; label?: string }) => {
      let list = movies;
      const cleanLabel = label.trim().toLowerCase();
      if (cleanLabel) {
        list = list.filter(
          (m) =>
            m.categories.some((c) => c.toLowerCase() === cleanLabel) ||
            m.vjSlug.toLowerCase() === cleanLabel ||
            m.genres.some((g) => g.toLowerCase().replace(/[^a-z0-9]+/g, '-') === cleanLabel)
        );
      }
      const cleanQuery = q.trim().toLowerCase();
      if (cleanQuery) {
        const terms = cleanQuery.split(/\s+/).filter(Boolean);
        list = list.filter((m) => {
          const haystack = `${m.title} ${m.displayTitle} ${m.vj} ${m.genres.join(' ')} ${m.categories.join(' ')} ${m.synopsis} ${m.altSummary}`.toLowerCase();
          return terms.every((t) => haystack.includes(t));
        });
      }
      return list;
    },
    [movies]
  );

  const markWatched = useCallback((movie: MovieItem) => {
    setRecentIds((prev) => {
      const next = [movie.id, ...prev.filter((id) => id !== movie.id)].slice(0, 12);
      try {
        localStorage.setItem(WATCHED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const recentlyWatched = useMemo(() => {
    if (recentIds.length === 0 || movies.length === 0) return [];
    const byId = new Map(movies.map((m) => [m.id, m]));
    return recentIds.map((id) => byId.get(id)).filter((m): m is MovieItem => Boolean(m));
  }, [recentIds, movies]);

  const value = useMemo(
    () => ({
      movies,
      pages,
      categories,
      vjs,
      loading,
      error,
      syncedAt,
      refreshCatalog,
      findMovieByPath,
      findPageByPath,
      filterMovies,
      recentlyWatched,
      markWatched,
    }),
    [
      movies,
      pages,
      categories,
      vjs,
      loading,
      error,
      syncedAt,
      refreshCatalog,
      findMovieByPath,
      findPageByPath,
      filterMovies,
      recentlyWatched,
      markWatched,
    ]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
};

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error('useCatalog must be used inside CatalogProvider');
  }
  return ctx;
}
