import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MovieCard } from '../components/MovieCard';
import { useCatalog } from '../context/CatalogContext';
import { usePageSEO } from '../hooks/usePageSEO';
import { GENRE_LABEL_MAP, VJ_LABEL_MAP } from '../types/movie';

const PAGE_SIZE = 24;

function formatLabelName(slug: string): string {
  const lower = slug.toLowerCase();
  if (GENRE_LABEL_MAP[lower]) return GENRE_LABEL_MAP[lower];
  if (VJ_LABEL_MAP[lower]) return VJ_LABEL_MAP[lower];
  return slug
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

export const CategoryPage: React.FC = () => {
  const { label = '' } = useParams<{ label: string }>();
  const { filterMovies, loading } = useCatalog();
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const labelName = formatLabelName(label);

  usePageSEO({
    title: `${labelName} Movies – Ssegu Movies (Firimu)`,
    description: `Watch all ${labelName} Luganda translated movies and series on Ssegu Movies (Firimu).`,
    path: `/search/label/${label}`,
  });

  const matchingMovies = useMemo(() => {
    const list = [...filterMovies({ label })];
    if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.published).getTime() - new Date(b.published).getTime());
    } else if (sortBy === 'title') {
      list.sort((a, b) => a.displayTitle.localeCompare(b.displayTitle));
    } else {
      list.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
    }
    return list;
  }, [filterMovies, label, sortBy]);

  const displayed = matchingMovies.slice(0, visibleCount);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
            <Link to="/" className="hover:text-white">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-zinc-200">{labelName}</span>
          </nav>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{labelName}</h1>
          <p className="mt-1 text-sm text-zinc-400 tabular-nums">
            {matchingMovies.length} {matchingMovies.length === 1 ? 'movie' : 'movies'} found in this category
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="category-sort" className="text-xs text-zinc-400">
            Sort:
          </label>
          <select
            id="category-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title')}
            className="h-10 rounded-lg border border-white/10 bg-[#121218] px-3 text-sm text-zinc-200 focus:border-[#E50914] focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>
      </div>

      {loading && matchingMovies.length === 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-[#121218]" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/10 bg-[#121218] p-10 text-center">
          <p className="font-display text-lg font-semibold text-white">No movies found for {labelName}</p>
          <Link
            to="/"
            className="mt-4 inline-flex min-h-[44px] items-center rounded-lg bg-[#E50914] px-5 py-2 text-sm font-semibold text-white"
          >
            Return Home
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {displayed.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>

          {visibleCount < matchingMovies.length && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="min-h-[48px] rounded-xl border border-white/15 bg-[#121218] px-8 py-3 text-sm font-semibold text-white hover:bg-[#1A1A23]"
              >
                Load More ({matchingMovies.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
