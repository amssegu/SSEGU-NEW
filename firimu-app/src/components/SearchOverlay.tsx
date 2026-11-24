import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Film, Search, X } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { movies, filterMovies } = useCatalog();

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(id);
    }
    setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return movies.slice(0, 8);
    return filterMovies({ q: query }).slice(0, 12);
  }, [query, movies, filterMovies]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    onClose();
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 px-4 pt-16 sm:pt-24 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Search movies"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#121218] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex items-center border-b border-white/10 px-4">
          <Search className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, series, or VJs (e.g. VJ Emmy, Horror, Mortuary)..."
            className="h-14 w-full bg-transparent px-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none sm:text-base"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          <div className="mb-2 flex items-center justify-between px-2 text-xs text-zinc-400">
            <span>{query.trim() ? `Results for "${query.trim()}"` : 'Latest Releases'}</span>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-1 font-medium text-[#E50914] hover:underline"
            >
              View all in catalogue
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {results.length === 0 ? (
            <div className="py-10 text-center text-sm text-zinc-400">
              No matching movies found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {results.map((movie) => (
                <li key={movie.id}>
                  <Link
                    to={movie.path}
                    onClick={onClose}
                    className="flex items-center gap-3.5 rounded-xl p-2 transition-colors hover:bg-white/[0.05]"
                  >
                    {movie.poster ? (
                      <img
                        src={movie.poster}
                        alt={movie.displayTitle}
                        referrerPolicy="no-referrer"
                        className="h-14 w-10 shrink-0 rounded-md object-cover bg-zinc-900"
                      />
                    ) : (
                      <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-zinc-500">
                        <Film className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-semibold text-white">
                        {movie.displayTitle}
                      </p>
                      <p className="truncate text-xs text-zinc-400">
                        {movie.vj} · {movie.genres.join(', ')}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
