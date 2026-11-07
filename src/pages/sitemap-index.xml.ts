import type { APIRoute } from 'astro';
import { articles, categories } from '../lib/articles';
export const GET: APIRoute = ({ site }) => {
  const base = (site?.toString() ?? 'https://ssegu.com/').replace(/\/$/, '');
  const paths = [
    '/',
    '/news/',
    ...categories
      .filter((category) => category !== 'news')
      .map((category) => `/category/${category}/`),
    '/about/',
    '/contact/',
    '/privacy/',
    '/terms/',
    ...articles.map((article) => `/${article.slug}/`),
  ];
  const urls = paths.map((path) => `<url><loc>${base}${path}</loc></url>`).join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
