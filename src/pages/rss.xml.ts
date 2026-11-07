import type { APIRoute } from 'astro';
import { articles } from '../lib/articles';
export const GET: APIRoute = ({ site }) => {
  const base = site?.toString() ?? 'https://ssegu.com/';
  const items = articles
    .map(
      (article) =>
        `<item><title><![CDATA[${article.title}]]></title><link>${base}${article.slug}/</link><description><![CDATA[${article.description}]]></description><pubDate>${new Date(`${article.publishedAt}T12:00:00Z`).toUTCString()}</pubDate></item>`,
    )
    .join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>SSEGU</title><link>${base}</link><description>SSEGU fixture publication feed</description>${items}</channel></rss>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
