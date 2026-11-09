import type { APIRoute } from 'astro';
import { getPublishedArticles } from '../lib/articles';
import { absoluteUrl } from '../lib/seo';
import { xmlEscape } from '../lib/sitemap';
export const GET: APIRoute = async ({ site }) => {
  const articles = await getPublishedArticles();
  const base = site?.toString() ?? 'https://ssegu.com/';
  const items = articles
    .slice(0, 50)
    .map(
      (article) =>
        `<item><title>${xmlEscape(article.title)}</title><link>${absoluteUrl(`/${article.slug}/`)}</link><description>${xmlEscape(article.description)}</description><pubDate>${new Date(`${article.publishedAt}T12:00:00Z`).toUTCString()}</pubDate></item>`,
    )
    .join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>SSEGU</title><link>${base}</link><description>SSEGU publication feed</description>${items}</channel></rss>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
