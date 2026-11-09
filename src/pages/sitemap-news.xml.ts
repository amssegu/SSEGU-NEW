import type { APIRoute } from 'astro';
import { categories, getPublishedArticles, pageCount } from '../lib/articles';
import { sitemapXml } from '../lib/sitemap';

export const GET: APIRoute = async () => {
  const articles = await getPublishedArticles();
  const newsPages = Array.from(
    { length: pageCount(articles.length) - 1 },
    (_, index) => `/news/page/${index + 2}/`,
  );
  const categoryPages = [];
  for (const category of categories.filter((value) => value !== 'news')) {
    const totalPages = pageCount((await getPublishedArticles(category)).length);
    categoryPages.push(
      ...Array.from(
        { length: totalPages - 1 },
        (_, index) => `/category/${category}/page/${index + 2}/`,
      ),
    );
  }
  const paths = [
    '/',
    '/news/',
    ...newsPages,
    ...categories
      .filter((category) => category !== 'news')
      .map((category) => `/category/${category}/`),
    ...categoryPages,
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
