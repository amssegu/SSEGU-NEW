import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Play } from 'lucide-react';
import type { MovieItem } from '../types/movie';

interface MovieCardProps {
  movie: MovieItem;
}

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const [imgError, setImgError] = useState(false);
  const primaryGenre = movie.genres[0] || 'Movie';
  const dateLabel = formatShortDate(movie.published);

  return (
    <Link
      to={movie.path}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0D] rounded-xl"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-white/10 bg-[#121218]">
        {movie.poster && !imgError ? (
          <img
            src={movie.poster}
            alt={movie.displayTitle}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#1A1A24] via-[#121218] to-[#0A0A0D] p-4 text-center">
            <Film className="mb-2 h-8 w-8 text-zinc-500" aria-hidden="true" />
            <span className="line-clamp-3 font-display text-xs font-medium text-zinc-400">
              {movie.displayTitle}
            </span>
          </div>
        )}

        {/* Scrim & subtle hover play cue */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/15 opacity-75 transition-opacity duration-200 group-hover:opacity-95"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          aria-hidden="true"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E50914] text-white shadow-lg shadow-black/50">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </span>
        </div>
      </div>

      {/* Clean, unboxed zero-pill typography below poster */}
      <div className="mt-2.5 space-y-1 px-0.5">
        <h3 className="line-clamp-2 font-display text-sm font-semibold leading-snug text-zinc-100 transition-colors duration-150 group-hover:text-white">
          {movie.displayTitle}
        </h3>
        <p className="truncate text-xs text-zinc-400 tabular-nums">
          <span>{movie.vj}</span>
          <span aria-hidden="true"> · </span>
          <span>{primaryGenre}</span>
          {movie.parts.length > 1 ? (
            <>
              <span aria-hidden="true"> · </span>
              <span>
                {movie.parts.length}{' '}
                {movie.genres.includes('Series') ? 'Episodes' : 'Parts'}
              </span>
            </>
          ) : (
            dateLabel && (
              <>
                <span aria-hidden="true"> · </span>
                <span>{dateLabel}</span>
              </>
            )
          )}
        </p>
      </div>
    </Link>
  );
};
