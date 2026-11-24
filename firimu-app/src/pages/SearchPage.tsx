import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { MovieCard } from '../components/MovieCard';
import { useCatalog } from '../context/CatalogContext';
import { usePageSEO } from '../hooks/usePageSEO';

const QUICK_LABELS = [
  { slug: '', label: 'All Catalogue' },
  { slug: 'action', label: 'Action' },
  { slug: 'horror', label: 'Horror' },
  { slug: 'scifi', label: 'Sci-Fi' },
  { slug: 'comedy', label: 'Comedy' },
  { slug: 'series', label: 'Series' },
  { slug: 'vj-junior', label: 'VJ Junior' },
  { slug: 'vj-emmy', label: 'VJ Emmy' },
  { slug: 'vj-mark', label: 'VJ Mark' },
];

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialLabel = searchParams.get('label') || '';
  const [query, setQuery] = useState(initialQuery);
  const [label, setLabel] = useState(initialLabel);
  const { movies, filterMovies, loading } = useCatalog();

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setLabel(searchParams.get('label') || '');
  }, [searchParams]);

  usePageSEO({
    title: query.trim()
      ? `Search "${query.trim()}" – Ssegu Movies (Firimu)`
      : 'Search All Movies – Ssegu Movies (Firimu)',
    description:
      'Search across the entire Ssegu Movies (Firimu) movie and series archive by title, VJ, or genre.',
    path: '/search',
  });

  const results = useMemo(
    () => filterMovies({ q: query, label }),
    [filterMovies, query, label]
  );

  const updateParams = (nextQ: string, nextLabel: string) => {
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set('q', nextQ.trim());
    if (nextLabel) params.set('label', nextLabel);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="border-b border-white/[0.08] pb-6">
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
          Search Movie Archive
        </h1>
        <p className="mt-1 text-sm text-zinc-400 tabular-nums">
          Search all {movies.length} indexed movies and series including older releases.
        </p>

        <div className="relative mt-5 max-w-2xl">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              updateParams(e.target.value, label);
            }}
            placeholder="Search movie title, VJ name (e.g. VJ Junior), or genre..."
            aria-label="Search full movie catalogue"
            className="h-12 w-full rounded-xl border border-white/15 bg-[#121218] pl-11 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-[#E50914] focus:outline-none sm:text-base"
          />
        </div>

        <div className="no-scrollbar mt-4 flex items-center gap-1.5 overflow-x-auto pb-1">
          {QUICK_LABELS.map((item) => {
            const active = label === item.slug;
            return (
              <button
                key={item.slug || 'all'}
                type="button"
                onClick={() => {
                  setLabel(item.slug);
                  updateParams(query, item.slug);
                }}
                className={`min-h-[38px] whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-[#E50914] text-white'
                    : 'bg-[#121218] text-zinc-300 hover:bg-[#1B1B24] hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-5 text-sm text-zinc-400 tabular-nums">
        {loading && movies.length === 0
          ? 'Loading full catalogue...'
          : `${results.length} matching ${results.length === 1 ? 'result' : 'results'}`}
      </p>

      {results.length === 0 && !loading ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-[#121218] p-10 text-center">
          <p className="font-display text-lg font-semibold text-white">No movies found</p>
          <p className="mt-1 text-sm text-zinc-400">
            Try searching a different title, VJ name, or clearing the category filter.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {results.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
};
