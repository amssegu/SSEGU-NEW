import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

const VJ_LINKS = [
  { label: 'VJ Junior', to: '/search/label/vj-junior' },
  { label: 'VJ Emmy', to: '/search/label/vj-emmy' },
  { label: 'VJ Mark', to: '/search/label/vj-mark' },
  { label: 'VJ KeVo', to: '/search/label/vj-kevo' },
  { label: 'VJ Jingo', to: '/search/label/vj-jingo' },
  { label: 'VJ Muba', to: '/search/label/vj-muba' },
  { label: 'VJ Ulio', to: '/search/label/vj-ulio' },
];

const CATEGORY_LINKS = [
  { label: 'Action', to: '/search/label/action' },
  { label: 'Adventure', to: '/search/label/adventure' },
  { label: 'Sci-Fi', to: '/search/label/scifi' },
  { label: 'Comedy', to: '/search/label/comedy' },
  { label: 'Crime', to: '/search/label/crime' },
  { label: 'Horror', to: '/search/label/horror' },
  { label: 'Animation & Fantasy', to: '/search/label/animation-fantasy' },
  { label: 'Series', to: '/search/label/series' },
];

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-white/[0.08] bg-[#08080B]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E50914] text-white">
                <Play className="ml-0.5 h-3.5 w-3.5 fill-current" aria-hidden="true" />
              </span>
              <span className="font-display text-lg font-bold text-white">Ssegu Movies (Firimu)</span>
            </Link>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
              Free Luganda translated Firimu and series instant search, in All VJS
            </p>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-white">Top VJs</h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-zinc-400">
              {VJ_LINKS.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-white">Categories</h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-zinc-400">
              {CATEGORY_LINKS.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/[0.08] pt-6 text-sm text-zinc-400 sm:flex-row sm:items-center">
          <p>Copyright &copy; 2026 Ssegu All Right Reserved</p>
          <nav aria-label="Footer Legal Links" className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link to="/p/terms-and-conditions.html" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link to="/p/contact-us.html" className="hover:text-white transition-colors">
              Contact us
            </Link>
            <Link to="/p/privacy-policy.html" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/p/about-us.html" className="hover:text-white transition-colors">
              About
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};
