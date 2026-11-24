import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Film, Play, RefreshCw, Search } from 'lucide-react';
import { MovieCard } from '../components/MovieCard';
import { useCatalog } from '../context/CatalogContext';
import { usePageSEO } from '../hooks/usePageSEO';

const GENRE_TABS = [
  { slug: '', label: 'All' },
  { slug: 'action', label: 'Action' },
  { slug: 'adventure', label: 'Adventure' },
  { slug: 'scifi', label: 'Sci-Fi' },
  { slug: 'comedy', label: 'Comedy' },
  { slug: 'crime', label: 'Crime' },
  { slug: 'horror', label: 'Horror' },
  { slug: 'animation-fantasy', label: 'Animation & Fantasy' },
  { slug: 'series', label: 'Series' },
];

const VJ_FILTERS = [
  { slug: '', label: 'All VJs' },
  { slug: 'vj-junior', label: 'VJ Junior' },
  { slug: 'vj-emmy', label: 'VJ Emmy' },
  { slug: 'vj-mark', label: 'VJ Mark' },
  { slug: 'vj-kevo', label: 'VJ KeVo' },
  { slug: 'vj-jingo', label: 'VJ Jingo' },
  { slug: 'vj-muba', label: 'VJ Muba' },
  { slug: 'vj-ulio', label: 'VJ Ulio' },
];

const PAGE_SIZE = 24;

export const HomePage: React.FC = () => {
  const { movies, recentlyWatched, loading, error, refreshCatalog } = useCatalog();
  const [heroIndex, setHeroIndex] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedVj, setSelectedVj] = useState('');
  const [inlineQuery, setInlineQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  usePageSEO({
    title: 'Ssegu Movies (Firimu) – Watch Translated Movies & Series',
    description:
      'Stream Luganda translated movies and series by VJ Junior, VJ Emmy, VJ Mark, VJ KeVo, VJ Jingo, VJ Muba, and VJ Ulio on Ssegu Movies (Firimu).',
    path: '/',
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Ssegu Movies (Firimu)',
      url: 'https://ssegu.com/firimu/',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://ssegu.com/firimu/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  });

  const featuredMovies = useMemo(() => {
    return movies.filter((m) => m.poster).slice(0, 5);
  }, [movies]);

  const activeHero = featuredMovies[heroIndex] || movies[0];

  const recentTicker = useMemo(() => movies.slice(0, 12), [movies]);

  const filteredMovies = useMemo(() => {
    let list = movies;
    if (selectedGenre) {
      list = list.filter(
        (m) =>
          m.categories.some((c) => c.toLowerCase() === selectedGenre) ||
          m.genres.some((g) => g.toLowerCase().replace(/[^a-z0-9]+/g, '-') === selectedGenre)
      );
    }
    if (selectedVj) {
      list = list.filter(
        (m) =>
          m.vjSlug === selectedVj ||
          m.categories.some((c) => c.toLowerCase() === selectedVj)
      );
    }
    if (inlineQuery.trim()) {
      const terms = inlineQuery.trim().toLowerCase().split(/\s+/);
      list = list.filter((m) => {
        const hay = `${m.title} ${m.displayTitle} ${m.vj} ${m.genres.join(' ')} ${m.synopsis}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      });
    }
    return list;
  }, [movies, selectedGenre, selectedVj, inlineQuery]);

  const displayedMovies = useMemo(
    () => filteredMovies.slice(0, visibleCount),
    [filteredMovies, visibleCount]
  );

  const handleGenreSelect = (slug: string) => {
    setSelectedGenre(slug);
    setVisibleCount(PAGE_SIZE);
  };

  const handleVjSelect = (slug: string) => {
    setSelectedVj(slug);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
      {/* Error Recovery */}
      {error && movies.length === 0 && (
        <div className="my-10 rounded-2xl border border-[#E50914]/30 bg-[#161013] p-8 text-center">
          <p className="font-display text-lg font-semibold text-white">
            Could not load movie catalogue
          </p>
          <p className="mt-1 text-sm text-zinc-400">{error}</p>
          <button
            type="button"
            onClick={() => void refreshCatalog()}
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#E50914] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#FF121F]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry Sync
          </button>
        </div>
      )}

      {/* Hero Featured Movie Spotlight */}
      {loading && movies.length === 0 ? (
        <section className="mt-6 h-[400px] sm:h-[460px] w-full animate-pulse rounded-2xl border border-white/10 bg-[#121218]" />
      ) : (
        activeHero && (
          <section className="relative mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#121218]">
            <div className="grid grid-cols-1 items-stretch lg:grid-cols-12">
              {/* Background / Poster Showcase */}
              <div className="relative min-h-[280px] sm:min-h-[360px] lg:col-span-7 lg:min-h-[440px]">
                {activeHero.poster ? (
                  <img
                    src={activeHero.backdrop || activeHero.poster}
                    alt={activeHero.displayTitle}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#181822]">
                    <Film className="h-14 w-14 text-zinc-600" />
                  </div>
                )}
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#121218] via-[#121218]/35 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-[#121218]/40 lg:to-[#121218]"
                  aria-hidden="true"
                />
              </div>

              {/* Editorial Spotlight Info */}
              <div className="relative z-10 flex flex-col justify-between p-6 sm:p-8 lg:col-span-5 lg:py-10 lg:pr-10">
                <div>
                  <p className="text-xs font-medium text-zinc-400 tabular-nums">
                    <span>Featured Release</span>
                    <span aria-hidden="true"> · </span>
                    <span>{activeHero.vj}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{activeHero.genres.slice(0, 2).join(', ')}</span>
                  </p>

                  <h1 className="mt-3 font-display text-2xl font-bold leading-tight text-white [text-wrap:balance] sm:text-3xl lg:text-4xl">
                    {activeHero.displayTitle}
                  </h1>

                  <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
                    {activeHero.synopsis}
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                  <Link
                    to={activeHero.path}
                    className="inline-flex min-h-[48px] items-center gap-2.5 rounded-xl bg-[#E50914] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#E50914]/25 transition-colors hover:bg-[#FF121F]"
                  >
                    <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                    <span>Watch Movie</span>
                  </Link>

                  {featuredMovies.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Previous featured movie"
                        onClick={() =>
                          setHeroIndex((i) => (i - 1 + featuredMovies.length) % featuredMovies.length)
                        }
                        className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.1] hover:text-white"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="min-w-[3ch] text-center font-mono text-xs text-zinc-400 tabular-nums">
                        {heroIndex + 1}/{featuredMovies.length}
                      </span>
                      <button
                        type="button"
                        aria-label="Next featured movie"
                        onClick={() => setHeroIndex((i) => (i + 1) % featuredMovies.length)}
                        className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.1] hover:text-white"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )
      )}

      {/* Recently Published Horizontal Strip */}
      {recentTicker.length > 0 && (
        <section className="mt-10" aria-labelledby="recent-strip-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="recent-strip-heading" className="font-display text-lg font-bold text-white sm:text-xl">
              Recently Published
            </h2>
            <Link
              to="/search"
              className="text-xs font-semibold text-zinc-400 transition-colors hover:text-white"
            >
              Browse All ({movies.length})
            </Link>
          </div>
          <div className="no-scrollbar flex gap-3.5 overflow-x-auto pb-2">
            {recentTicker.map((movie) => (
              <Link
                key={movie.id}
                to={movie.path}
                className="group relative w-44 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#121218] sm:w-52"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900">
                  {movie.poster && (
                    <img
                      src={movie.backdrop || movie.poster}
                      alt={movie.displayTitle}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  )}
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"
                    aria-hidden="true"
                  />
                  <div className="absolute inset-x-2.5 bottom-2">
                    <p className="truncate text-[11px] font-medium text-zinc-300">
                      {movie.vj} · {movie.genres[0]}
                    </p>
                    <p className="truncate font-display text-xs font-semibold text-white">
                      {movie.displayTitle}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Continue Watching (only if user has watched movies locally) */}
      {recentlyWatched.length > 0 && (
        <section className="mt-10" aria-labelledby="continue-watching-heading">
          <h2 id="continue-watching-heading" className="mb-4 font-display text-lg font-bold text-white sm:text-xl">
            Recently Watched
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {recentlyWatched.slice(0, 6).map((movie) => (
              <MovieCard key={`recent-${movie.id}`} movie={movie} />
            ))}
          </div>
        </section>
      )}

      {/* Main Filterable Movie Catalogue */}
      <section className="mt-12" aria-labelledby="catalogue-heading">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="catalogue-heading" className="font-display text-xl font-bold text-white sm:text-2xl">
              Movie Catalogue
            </h2>
            <p className="mt-1 text-sm text-zinc-400 tabular-nums">
              Showing {displayedMovies.length} of {filteredMovies.length} movies &amp; series
            </p>
          </div>

          {/* Inline quick search + VJ dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                aria-hidden="true"
              />
              <input
                type="search"
                value={inlineQuery}
                onChange={(e) => {
                  setInlineQuery(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder="Filter by title or VJ..."
                aria-label="Filter movies by title or VJ"
                className="h-10 w-full rounded-lg border border-white/10 bg-[#121218] pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#E50914] focus:outline-none"
              />
            </div>

            <select
              value={selectedVj}
              onChange={(e) => handleVjSelect(e.target.value)}
              aria-label="Filter by VJ"
              className="h-10 rounded-lg border border-white/10 bg-[#121218] px-3 text-sm text-zinc-200 focus:border-[#E50914] focus:outline-none"
            >
              {VJ_FILTERS.map((vj) => (
                <option key={vj.slug || 'all'} value={vj.slug}>
                  {vj.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Genre Interactive Filter Buttons */}
        <div className="no-scrollbar mt-4 flex items-center gap-1.5 overflow-x-auto pb-2">
          {GENRE_TABS.map((tab) => {
            const active = selectedGenre === tab.slug;
            return (
              <button
                key={tab.slug || 'all'}
                type="button"
                onClick={() => handleGenreSelect(tab.slug)}
                className={`min-h-[40px] whitespace-nowrap shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                  active
                    ? 'bg-[#E50914] text-white'
                    : 'bg-[#121218] text-zinc-300 hover:bg-[#1B1B24] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {loading && movies.length === 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div key={idx} className="space-y-2.5">
                <div className="aspect-[2/3] w-full animate-pulse rounded-xl bg-[#14141C]" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-[#14141C]" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-[#14141C]" />
              </div>
            ))}
          </div>
        ) : displayedMovies.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-[#121218] p-10 text-center">
            <p className="font-display text-lg font-semibold text-white">No movies match your filters</p>
            <p className="mt-1 text-sm text-zinc-400">
              Try clearing your search term or selecting a different genre or VJ.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedGenre('');
                setSelectedVj('');
                setInlineQuery('');
              }}
              className="mt-4 min-h-[44px] rounded-lg bg-[#E50914] px-5 py-2 text-sm font-semibold text-white hover:bg-[#FF121F]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {displayedMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>

            {visibleCount < filteredMovies.length && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="min-h-[48px] rounded-xl border border-white/15 bg-[#121218] px-8 py-3 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-[#1A1A23]"
                >
                  Load More Movies ({filteredMovies.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
