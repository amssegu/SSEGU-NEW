import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { usePageSEO } from '../hooks/usePageSEO';

const FALLBACK_CONTENT: Record<string, { title: string; paragraphs: string[] }> = {
  '/p/about-us.html': {
    title: 'About Ssegu Movies (Firimu)',
    paragraphs: [
      'Ssegu Movies (Firimu) brings Luganda translated movies and series from top Ugandan VJs directly to your desktop and mobile screen.',
      'Browse by VJ, genre, or search across our full movie and series archive anytime.',
    ],
  },
  '/p/contact-us.html': {
    title: 'Contact Us',
    paragraphs: [
      'Have questions, movie requests, or feedback about Ssegu Movies (Firimu)? Reach out to our team directly using the contact details below.',
      'For copyright inquiries, technical assistance, or partnership questions, please send us a message.',
    ],
  },
  '/p/terms-and-conditions.html': {
    title: 'Terms and Conditions',
    paragraphs: [
      'By accessing and using Ssegu Movies (Firimu) at ssegu.com/firimu/, you agree to comply with these Terms and Conditions and all applicable laws.',
      'All content listings on Ssegu Movies (Firimu) are provided for personal, non-commercial viewing.',
    ],
  },
  '/p/privacy-policy.html': {
    title: 'Privacy Policy',
    paragraphs: [
      'Ssegu Movies (Firimu) respects your privacy. Watch history and preferences are stored locally in your browser so your device stays fast and private.',
      'We do not sell your personal information to third parties.',
    ],
  },
};

export const StaticPage: React.FC = () => {
  const location = useLocation();
  const { findPageByPath, loading } = useCatalog();

  const normalizedPath =
    location.pathname === '/p/about.html' ? '/p/about-us.html' : location.pathname;
  const page = findPageByPath(normalizedPath);
  const fallback = FALLBACK_CONTENT[normalizedPath] || FALLBACK_CONTENT['/p/about-us.html'];

  const title = page?.title || fallback.title;
  const paragraphs = page && page.paragraphs.length > 0 ? page.paragraphs : fallback.paragraphs;

  usePageSEO({
    title: `${title} – Ssegu Movies (Firimu)`,
    description: paragraphs[0]?.slice(0, 155) || title,
    path: normalizedPath,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-zinc-400">
        <Link to="/" className="hover:text-white">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-zinc-200">{title}</span>
      </nav>

      <article className="rounded-2xl border border-white/10 bg-[#121218] p-6 sm:p-10">
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{title}</h1>

        {loading && !page ? (
          <div className="mt-6 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-white/10" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-white/10" />
          </div>
        ) : (
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
            {paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}

            {page?.emails && page.emails.length > 0 && (
              <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-semibold text-zinc-400">Direct Email</p>
                <div className="mt-2 flex flex-wrap gap-3">
                  {page.emails.map((email) => (
                    <a
                      key={email}
                      href={`mailto:${email}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-[#E50914]"
                    >
                      <Mail className="h-4 w-4 text-[#E50914]" aria-hidden="true" />
                      {email}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </article>
    </div>
  );
};
