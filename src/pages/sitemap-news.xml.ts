import type { APIRoute } from 'astro';
import { articles, categories } from '../lib/articles';
import { sitemapXml } from '../lib/sitemap';

export const GET: APIRoute = () => {
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
  return new Response(sitemapXml(paths), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
