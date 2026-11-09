import { absoluteUrl, SITE_URL } from './seo';

export function xmlEscape(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function sitemapXml(paths: string[]) {
  const urls = paths
    .map((path) => `<url><loc>${xmlEscape(absoluteUrl(path))}</loc></url>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

export function sitemapIndexXml(names: string[]) {
  const sitemaps = names
    .map((name) => `<sitemap><loc>${xmlEscape(`${SITE_URL}/${name}`)}</loc></sitemap>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemaps}</sitemapindex>`;
}
