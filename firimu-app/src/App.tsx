import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { OfflineBanner } from './components/OfflineBanner';
import { PWAUpdateToast } from './components/PWAUpdateToast';
import { SearchOverlay } from './components/SearchOverlay';
import { CatalogProvider } from './context/CatalogContext';
import { CategoryPage } from './pages/CategoryPage';
import { HomePage } from './pages/HomePage';
import { MoviePage } from './pages/MoviePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SearchPage } from './pages/SearchPage';
import { StaticPage } from './pages/StaticPage';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
};

const AppShell: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0A0D] text-[#F4F4F7]">
      <ScrollToTop />
      <Header onOpenSearch={() => setSearchOpen(true)} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/search/label/:label" element={<CategoryPage />} />
          <Route path="/p/:slug" element={<StaticPage />} />
          {/* Exact Blogger post URL structure: /2026/11/kali-mu-vj-emmy-mortuary-assistant.html */}
          <Route path="/:year/:month/:slug" element={<MoviePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <OfflineBanner />
      <PWAUpdateToast />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter basename="/firimu">
      <CatalogProvider>
        <AppShell />
      </CatalogProvider>
    </BrowserRouter>
  );
}
