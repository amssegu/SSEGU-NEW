import type { APIRoute } from 'astro';
import { sitemapIndexXml } from '../lib/sitemap';

export const GET: APIRoute = () =>
  new Response(sitemapIndexXml(['sitemap-news.xml', 'sitemap-work.xml']), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
