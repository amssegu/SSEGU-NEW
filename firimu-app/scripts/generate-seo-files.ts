import fs from 'node:fs';
import path from 'node:path';
import {
  buildRobotsTxt,
  buildSitemapXml,
  fetchAllBloggerMovies,
  fetchAllBloggerPages,
} from '../server/bloggerService.ts';

async function main() {
  const publicDir = path.resolve(process.cwd(), 'public');
  fs.mkdirSync(publicDir, { recursive: true });

  fs.writeFileSync(path.join(publicDir, 'robots.txt'), buildRobotsTxt('https://ssegu.com'), 'utf8');

  try {
    const [catalog, pages] = await Promise.all([
      fetchAllBloggerMovies(true),
      fetchAllBloggerPages(true),
    ]);
    const xml = buildSitemapXml(catalog.movies, pages, 'https://ssegu.com');
    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
    console.log(`Generated public/sitemap.xml with ${catalog.movies.length} movies and ${pages.length} pages.`);
  } catch (err) {
    console.warn('Could not fetch live Blogger feeds for static sitemap, writing base sitemap:', err);
    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), buildSitemapXml([], [], 'https://ssegu.com'), 'utf8');
  }
}

main();
