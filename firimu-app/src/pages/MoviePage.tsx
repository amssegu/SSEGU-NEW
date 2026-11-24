import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Layers,
  Play,
  Share2,
} from 'lucide-react';
import { AdSenseSlot } from '../components/AdSenseSlot';
import { FirimuPlayer } from '../components/FirimuPlayer';
import { MovieCard } from '../components/MovieCard';
import { useCatalog } from '../context/CatalogContext';
import { usePageSEO } from '../hooks/usePageSEO';
import type { MovieItem } from '../types/movie';

export const MoviePage: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { movies, loading, findMovieByPath, markWatched } = useCatalog();
  const [copied, setCopied] = useState(false);
  const [directMovie, setDirectMovie] = useState<MovieItem | null>(null);
  const [directLoading, setDirectLoading] = useState(false);

  const movieFromCatalog = findMovieByPath(location.pathname);
  const movie = movieFromCatalog || directMovie;

  const partParam = Number(searchParams.get('part') || '1');
  const [selectedPartIndex, setSelectedPartIndex] = useState<number>(
    Number.isFinite(partParam) && partParam >= 1 ? partParam - 1 : 0
  );

  // Sync part index cleanly when URL or movie changes
  useEffect(() => {
    const requested = Number(searchParams.get('part') || '1');
    const maxIndex = Math.max(0, (movie?.parts?.length || 1) - 1);
    if (Number.isFinite(requested) && requested >= 1) {
      setSelectedPartIndex(Math.min(requested - 1, maxIndex));
    } else {
      setSelectedPartIndex(0);
    }
  }, [location.pathname, searchParams, movie?.parts?.length]);

  // Fallback direct lookup via backend API if user lands directly on a deep movie URL
  useEffect(() => {
    if (movieFromCatalog || loading) return;
    let active = true;
    setDirectLoading(true);
    fetch(`/firimu/api/movie?path=${encodeURIComponent(location.pathname)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { movie?: MovieItem } | null) => {
        if (active && data?.movie) {
          setDirectMovie(data.movie);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setDirectLoading(false);
      });
    return () => {
      active = false;
    };
  }, [location.pathname, movieFromCatalog, loading]);

  const currentIdx = useMemo(() => {
    if (!movie) return -1;
    return movies.findIndex((m) => m.id === movie.id);
  }, [movies, movie]);

  const newerMovie = currentIdx > 0 ? movies[currentIdx - 1] : null;
  const olderMovie = currentIdx >= 0 && currentIdx < movies.length - 1 ? movies[currentIdx + 1] : null;

  const relatedMovies = useMemo(() => {
    if (!movie) return [];
    return movies
      .filter(
        (m) =>
          m.id !== movie.id &&
          (m.categories.some((c) => movie.categories.includes(c)) || m.vjSlug === movie.vjSlug)
      )
      .slice(0, 6);
  }, [movies, movie]);

  usePageSEO({
    title: movie
      ? `${movie.displayTitle} – Ssegu Movies (Firimu)`
      : 'Watch Movie – Ssegu Movies (Firimu)',
    description: movie
      ? `${movie.displayTitle} (${movie.vj}, ${movie.genres.join(', ')}). ${movie.synopsis.slice(0, 130)}`
      : 'Stream Luganda translated movies on Ssegu Movies (Firimu).',
    path: movie?.path || location.pathname,
    image: movie?.poster,
    type: 'video.movie',
    jsonLd: movie
      ? {
          '@context': 'https://schema.org',
          '@type': 'Movie',
          name: movie.displayTitle,
          datePublished: movie.published,
          image: movie.poster,
          description: movie.synopsis,
          genre: movie.genres,
          url: `https://ssegu.com/firimu${movie.path}`,
        }
      : undefined,
  });

  if ((loading || directLoading) && !movie) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="aspect-video w-full animate-pulse rounded-2xl bg-[#121218]" />
        <div className="mt-6 h-8 w-2/3 animate-pulse rounded bg-[#121218]" />
        <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-[#121218]" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-2xl font-bold text-white">Movie not found</h1>
        <p className="mt-2 text-sm text-zinc-400">
          We could not find a movie matching this URL in the current catalogue.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center rounded-lg bg-[#E50914] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#FF121F]"
          >
            Back to Home
          </Link>
          <Link
            to="/search"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-white/5"
          >
            Search Catalogue
          </Link>
        </div>
      </div>
    );
  }

  const parts = movie.parts && movie.parts.length > 0 ? movie.parts : [];
  const safePartIndex = Math.min(selectedPartIndex, Math.max(0, parts.length - 1));
  const activePart = parts[safePartIndex];
  const isSeries =
    movie.genres.includes('Series') ||
    parts.some((p) => /episode/i.test(p.label));

  const selectPart = (idx: number) => {
    setSelectedPartIndex(idx);
    if (idx === 0) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ part: String(idx + 1) }, { replace: true });
    }
  };

  const shareUrl = `https://ssegu.com/firimu${movie.path}`;
  const formattedDate = new Date(movie.published).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  const primaryGenreSlug = movie.categories.find((c) =>
    ['action', 'adventure', 'scifi', 'comedy', 'crime', 'horror', 'animation-fantasy', 'series'].includes(
      c.toLowerCase()
    )
  );

  return (
    <article className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
        <Link to="/" className="hover:text-white transition-colors">
          Home
        </Link>
        {primaryGenreSlug && (
          <>
            <span aria-hidden="true">/</span>
            <Link
              to={`/search/label/${primaryGenreSlug.toLowerCase()}`}
              className="capitalize hover:text-white transition-colors"
            >
              {movie.genres[0]}
            </Link>
          </>
        )}
        <span aria-hidden="true">/</span>
        <Link to={`/search/label/${movie.vjSlug}`} className="text-zinc-200 hover:text-white transition-colors">
          {movie.vj}
        </Link>
      </nav>

      {/* Movie Title & Metadata Header */}
      <header className="mb-4">
        <h1 className="font-display text-2xl font-bold leading-tight text-white [text-wrap:balance] sm:text-3xl">
          {movie.displayTitle}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-zinc-400 tabular-nums">
          <Link
            to={`/search/label/${movie.vjSlug}`}
            className="font-semibold text-white hover:text-[#E50914] transition-colors"
          >
            {movie.vj}
          </Link>
          <span aria-hidden="true">·</span>
          <span>{movie.genres.join(', ')}</span>
          {parts.length > 1 && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {parts.length} {isSeries ? 'Episodes' : 'Parts'}
              </span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <time dateTime={movie.published}>{formattedDate}</time>
        </div>
      </header>

      {/* Top Well-Seen Ad Unit (Directly below Movie Title and before Video Player) */}
      <AdSenseSlot
        client="ca-pub-7777536386845474"
        slot="9970802556"
        format="auto"
        slotKey={movie.id}
        className="mb-5"
      />

      {/* FIRIMU Video Player */}
      <FirimuPlayer
        movie={movie}
        activePart={activePart}
        onPlayStart={() => markWatched(movie)}
      />

      {/* Multi-Part / Episodes Selector (for 2-3 part movies and 5-20+ episode series) */}
      {parts.length > 1 && (
        <section
          aria-labelledby="parts-heading"
          className="mt-5 rounded-2xl border border-white/10 bg-[#121218] p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
            <div className="flex items-center gap-2.5">
              <Layers className="h-4 w-4 text-[#E50914]" aria-hidden="true" />
              <h2 id="parts-heading" className="font-display text-base font-bold text-white sm:text-lg">
                {isSeries ? `Episodes (${parts.length})` : `Parts (${parts.length})`}
              </h2>
              {activePart && (
                <span className="text-xs text-zinc-400 tabular-nums">
                  · Selected: <strong className="text-zinc-200">{activePart.label}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePartIndex <= 0}
                onClick={() => selectPart(safePartIndex - 1)}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Prev
              </button>
              <button
                type="button"
                disabled={safePartIndex >= parts.length - 1}
                onClick={() => selectPart(safePartIndex + 1)}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {parts.map((part, idx) => {
              const isSelected = idx === safePartIndex;
              return (
                <button
                  key={`${part.index}-${part.videoUrl}`}
                  type="button"
                  onClick={() => selectPart(idx)}
                  aria-current={isSelected ? 'true' : undefined}
                  className={`flex min-h-[48px] items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                    isSelected
                      ? 'border-[#E50914] bg-[#E50914] text-white shadow-md shadow-[#E50914]/25'
                      : 'border-white/10 bg-[#171720] text-zinc-200 hover:border-white/25 hover:bg-[#1E1E2A]'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                      isSelected ? 'bg-white text-[#E50914]' : 'bg-white/10 text-zinc-300'
                    }`}
                  >
                    {isSelected ? (
                      <Play className="ml-0.5 h-3.5 w-3.5 fill-current" aria-hidden="true" />
                    ) : (
                      part.index
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold sm:text-sm">
                      {part.label}
                    </span>
                    <span
                      className={`block text-[11px] ${
                        isSelected ? 'text-white/85' : 'text-zinc-400'
                      }`}
                    >
                      {isSelected ? 'Ready to play' : `Part ${part.index}`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Second Ad Unit (Before Synopsis) */}
      <AdSenseSlot
        client="ca-pub-7777536386845474"
        slot="9970802556"
        format="auto"
        slotKey={`${movie.id}-synopsis`}
        className="mt-6"
      />

      {/* Synopsis & Share */}
      <div className="mt-7 grid grid-cols-1 gap-8 border-b border-white/[0.08] pb-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <h2 className="font-display text-lg font-bold text-white">Synopsis</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
            {movie.synopsis.split('\n\n').map((para, index) => (
              <p key={index}>{para}</p>
            ))}
          </div>

          {/* Unboxed Category Links */}
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300">Labels:</span>
            {movie.categories.map((cat) => (
              <Link
                key={cat}
                to={`/search/label/${cat}`}
                className="underline decoration-white/20 underline-offset-4 hover:text-white hover:decoration-[#E50914]"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>

        {/* Poster & Share Column */}
        <aside className="flex flex-col gap-4 lg:col-span-4">
          <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-[#121218] p-4">
            {(activePart?.poster || movie.poster) && (
              <img
                src={activePart?.poster || movie.poster}
                alt={movie.displayTitle}
                referrerPolicy="no-referrer"
                className="h-28 w-20 shrink-0 rounded-lg object-cover bg-zinc-900"
              />
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-xs font-medium text-zinc-400">Share this movie</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${movie.displayTitle} | ${shareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-[#1F2C23] px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-[#27392C]"
                >
                  <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                  WhatsApp
                </a>
                <a
                  href={`https://www.facebook.com/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[36px] items-center rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/[0.12]"
                >
                  Facebook
                </a>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/[0.12]"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Newer / Older Movie Navigation */}
      {(newerMovie || olderMovie) && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {newerMovie ? (
            <Link
              to={newerMovie.path}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#121218] p-4 transition-colors hover:border-white/20 hover:bg-[#171720]"
            >
              <ChevronLeft className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs text-zinc-400">Newer Movie</p>
                <p className="truncate font-display text-sm font-semibold text-white">
                  {newerMovie.displayTitle}
                </p>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {olderMovie && (
            <Link
              to={olderMovie.path}
              className="flex items-center justify-end gap-3 rounded-xl border border-white/10 bg-[#121218] p-4 text-right transition-colors hover:border-white/20 hover:bg-[#171720]"
            >
              <div className="min-w-0">
                <p className="text-xs text-zinc-400">Older Movie</p>
                <p className="truncate font-display text-sm font-semibold text-white">
                  {olderMovie.displayTitle}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}

      {/* Related Movies */}
      {relatedMovies.length > 0 && (
        <section className="mt-12" aria-labelledby="related-heading">
          <div className="mb-5 flex items-center justify-between">
            <h2 id="related-heading" className="font-display text-xl font-bold text-white">
              More @ Ssegu
            </h2>
            {primaryGenreSlug && (
              <Link
                to={`/search/label/${primaryGenreSlug.toLowerCase()}`}
                className="text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Show more
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {relatedMovies.map((item) => (
              <MovieCard key={item.id} movie={item} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
};
