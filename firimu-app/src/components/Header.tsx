import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, Play, Search, X } from 'lucide-react';
import { SSEGU_NAVIGATION } from '../types/movie';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [location.pathname, location.search]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0A0A0D]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914] rounded-md"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E50914] text-white">
            <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            Ssegu Movies
          </span>
        </Link>

        {/* Zone 2: Desktop Navigation (reproducing vj.ssegu.com menu & dropdowns) */}
        <nav className="hidden lg:flex items-center gap-6" aria-label="Main Menu">
          {SSEGU_NAVIGATION.map((item) => {
            if (item.children) {
              const isOpen = openDropdown === item.label;
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenDropdown(isOpen ? null : item.label)}
                    className="inline-flex min-h-[40px] items-center gap-1 whitespace-nowrap shrink-0 text-sm font-medium text-zinc-300 transition-colors hover:text-white"
                  >
                    <span>{item.label}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>

                  {isOpen && (
                    <div className="absolute left-0 top-full pt-1.5 z-50">
                      <ul className="w-56 overflow-hidden rounded-xl border border-white/10 bg-[#121218] py-1.5 shadow-2xl">
                        {item.children.map((sub) => (
                          <li key={sub.to}>
                            <Link
                              to={sub.to}
                              onClick={() => setOpenDropdown(null)}
                              className="block px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                            >
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            }

            if (item.external && item.href) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center whitespace-nowrap shrink-0 text-sm font-medium text-zinc-300 transition-colors hover:text-white"
                >
                  {item.label}
                </a>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.to || '/'}
                className="inline-flex min-h-[40px] items-center whitespace-nowrap shrink-0 text-sm font-medium text-zinc-300 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Search Trigger + Primary Install Action + Mobile Drawer Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search movies"
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-zinc-300 transition-colors hover:bg-white/[0.09] hover:text-white"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline whitespace-nowrap">Search</span>
          </button>

          <PWAInstallButton compact />

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.09] lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="border-t border-white/[0.08] bg-[#101016] px-4 py-4 lg:hidden">
          <nav aria-label="Mobile Menu" className="space-y-1">
            {SSEGU_NAVIGATION.map((item) => {
              if (item.children) {
                const expanded = mobileAccordion === item.label;
                return (
                  <div key={item.label} className="border-b border-white/[0.06] pb-1">
                    <button
                      type="button"
                      onClick={() => setMobileAccordion(expanded ? null : item.label)}
                      className="flex min-h-[44px] w-full items-center justify-between px-2 text-left text-sm font-semibold text-zinc-200"
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                    {expanded && (
                      <ul className="space-y-0.5 pl-4 pb-2">
                        {item.children.map((sub) => (
                          <li key={sub.to}>
                            <Link
                              to={sub.to}
                              onClick={() => setMobileOpen(false)}
                              className="flex min-h-[40px] items-center text-sm text-zinc-400 hover:text-white"
                            >
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              }

              if (item.external && item.href) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[44px] items-center border-b border-white/[0.06] px-2 text-sm font-semibold text-zinc-200"
                  >
                    {item.label}
                  </a>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.to || '/'}
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-[44px] items-center border-b border-white/[0.06] px-2 text-sm font-semibold text-zinc-200"
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              to="/p/contact-us.html"
              onClick={() => setMobileOpen(false)}
              className="flex min-h-[44px] items-center px-2 text-sm font-semibold text-zinc-200"
            >
              Contact Us
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};
