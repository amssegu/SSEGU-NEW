import type { APIRoute } from 'astro';
import { workArticles } from '../../lib/work';
import { absoluteUrl } from '../../lib/seo';
import { xmlEscape } from '../../lib/sitemap';

export const GET: APIRoute = () => {
  const items = workArticles
    .map(
      (article) =>
        `<item><title>${xmlEscape(article.title)}</title><link>${absoluteUrl(`/work/career-advice/${article.slug}/`)}</link><description>${xmlEscape(article.description)}</description><pubDate>${new Date(`${article.publishedAt}T12:00:00Z`).toUTCString()}</pubDate></item>`,
    )
    .join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>SSEGU Work</title><link>${absoluteUrl('/work/')}</link><description>Jobs, skills and career advice from SSEGU Work</description>${items}</channel></rss>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
