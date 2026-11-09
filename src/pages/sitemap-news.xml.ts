import type { APIRoute } from 'astro';
import { categories, getPublishedArticles } from '../lib/articles';
import { sitemapXml } from '../lib/sitemap';

export const GET: APIRoute = async () => {
  const articles = await getPublishedArticles();
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
