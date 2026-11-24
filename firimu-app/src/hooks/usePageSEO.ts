import { useEffect } from 'react';

interface PageSEOOptions {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'video.movie';
  jsonLd?: Record<string, unknown>;
}

const PRODUCTION_BASE = 'https://ssegu.com/firimu';
const DEFAULT_IMAGE = 'https://ssegu.com/firimu/pwa-512x512.png';

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function usePageSEO({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  jsonLd,
}: PageSEOOptions) {
  useEffect(() => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const canonicalUrl = `${PRODUCTION_BASE}${cleanPath === '/' ? '/' : cleanPath}`;
    const resolvedImage = image || DEFAULT_IMAGE;

    document.title = title;

    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:site_name', 'Ssegu Movies (Firimu)');
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', resolvedImage);

    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', resolvedImage);

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    const ldId = 'ssegu-dynamic-jsonld';
    let scriptEl = document.getElementById(ldId) as HTMLScriptElement | null;
    if (jsonLd) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = ldId;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(jsonLd);
    } else if (scriptEl) {
      scriptEl.remove();
    }
  }, [title, description, path, image, type, jsonLd]);
}
