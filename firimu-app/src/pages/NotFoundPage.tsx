import React from 'react';
import { Link } from 'react-router-dom';
import { usePageSEO } from '../hooks/usePageSEO';

export const NotFoundPage: React.FC = () => {
  usePageSEO({
    title: 'Page Not Found – Ssegu Movies (Firimu)',
    description: 'The requested page could not be found on Ssegu Movies (Firimu).',
    path: '/',
  });

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <p className="font-mono text-sm font-semibold text-[#E50914]">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-white">Page not found</h1>
      <p className="mt-2 text-sm text-zinc-400">
        The page or movie URL you entered is not available. Browse the latest releases or search the full catalogue.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          to="/"
          className="inline-flex min-h-[44px] items-center rounded-lg bg-[#E50914] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#FF121F]"
        >
          Go Home
        </Link>
        <Link
          to="/search"
          className="inline-flex min-h-[44px] items-center rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-white/5"
        >
          Search Movies
        </Link>
      </div>
    </div>
  );
};
