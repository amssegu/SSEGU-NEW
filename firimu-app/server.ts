import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildRobotsTxt,
  buildSitemapXml,
  fetchAllBloggerMovies,
  fetchAllBloggerPages,
} from './server/bloggerService.ts';

const PORT = Number(process.env.PORT) || 3000;
const BASE_PATH = '/firimu';
const CANONICAL_ORIGIN = process.env.CANONICAL_ORIGIN || 'https://ssegu.com';

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());

  // Security headers compatible with iframe preview and video playback
  app.use((_, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Redirect root '/' to '/firimu/' so AI Studio preview and direct hits enter the subdirectory app cleanly
  app.get('/', (_req, res) => {
    res.redirect(302, `${BASE_PATH}/`);
  });

  // Health check
  app.get(`${BASE_PATH}/api/health`, (_req, res) => {
    res.json({ ok: true, service: 'ssegu-movies-firimu', basePath: BASE_PATH });
  });

  // Full Blogger catalog API (supports optional label, vj, q, limit, offset)
  app.get(`${BASE_PATH}/api/movies`, async (req, res) => {
    try {
      const refresh = req.query.refresh === '1';
      const catalog = await fetchAllBloggerMovies(refresh);

      const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
      const label = typeof req.query.label === 'string' ? req.query.label.trim().toLowerCase() : '';

      let filtered = catalog.movies;

      if (label) {
        filtered = filtered.filter(
          (m) =>
            m.categories.some((c) => c.toLowerCase() === label) ||
            m.vjSlug.toLowerCase() === label ||
            m.genres.some((g) => g.toLowerCase().replace(/[^a-z0-9]+/g, '-') === label)
        );
      }

      if (q) {
        const terms = q.split(/\s+/).filter(Boolean);
        filtered = filtered.filter((m) => {
          const haystack = `${m.title} ${m.displayTitle} ${m.vj} ${m.genres.join(' ')} ${m.categories.join(' ')} ${m.synopsis}`.toLowerCase();
          return terms.every((term) => haystack.includes(term));
        });
      }

      res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
      res.json({
        ...catalog,
        movies: filtered,
        total: filtered.length,
        fullCatalogTotal: catalog.total,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load movies from Blogger';
      res.status(502).json({ error: message });
    }
  });

  // Single movie lookup by exact Blogger path (e.g. /2026/11/kali-mu-vj-emmy-mortuary-assistant.html)
  app.get(`${BASE_PATH}/api/movie`, async (req, res) => {
    try {
      const rawPath = typeof req.query.path === 'string' ? req.query.path.trim() : '';
      if (!rawPath || !rawPath.startsWith('/')) {
        res.status(400).json({ error: 'Invalid movie path parameter.' });
        return;
      }

      const catalog = await fetchAllBloggerMovies();
      const normalized = rawPath.replace(/^\/firimu/, '');
      const idx = catalog.movies.findIndex((m) => m.path === normalized);
      if (idx === -1) {
        res.status(404).json({ error: 'Movie not found in Blogger catalog.' });
        return;
      }

      const movie = catalog.movies[idx];
      const newerMovie = idx > 0 ? catalog.movies[idx - 1] : null;
      const olderMovie = idx < catalog.movies.length - 1 ? catalog.movies[idx + 1] : null;
      const related = catalog.movies
        .filter(
          (m) =>
            m.id !== movie.id &&
            (m.categories.some((c) => movie.categories.includes(c)) || m.vjSlug === movie.vjSlug)
        )
        .slice(0, 8);

      res.json({ movie, newerMovie, olderMovie, related });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch movie';
      res.status(502).json({ error: message });
    }
  });

  // Static Blogger pages (About, Contact, Terms, Privacy Policy)
  app.get(`${BASE_PATH}/api/pages`, async (_req, res) => {
    try {
      const pages = await fetchAllBloggerPages();
      res.setHeader('Cache-Control', 'public, max-age=600');
      res.json({ pages });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load Blogger pages';
      res.status(502).json({ error: message });
    }
  });

  // Dynamic XML Sitemap
  app.get(`${BASE_PATH}/sitemap.xml`, async (_req, res) => {
    try {
      const [catalog, pages] = await Promise.all([
        fetchAllBloggerMovies(),
        fetchAllBloggerPages(),
      ]);
      const xml = buildSitemapXml(catalog.movies, pages, CANONICAL_ORIGIN);
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=1800');
      res.send(xml);
    } catch {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.send(buildSitemapXml([], [], CANONICAL_ORIGIN));
    }
  });

  // Dynamic robots.txt
  app.get(`${BASE_PATH}/robots.txt`, (_req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(buildRobotsTxt(CANONICAL_ORIGIN));
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(
      BASE_PATH,
      express.static(distDir, {
        index: false,
        maxAge: '7d',
        setHeaders(res, filePath) {
          if (filePath.endsWith('sw.js') || filePath.endsWith('manifest.webmanifest')) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      })
    );

    // SPA fallback for every dynamic Blogger movie URL & category route under /firimu/
    app.get(`${BASE_PATH}/*`, (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
    app.get(BASE_PATH, (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  // Warm the Blogger cache in background on boot
  fetchAllBloggerMovies().catch((err) => {
    console.warn('[Blogger Warmup] Will retry on first request:', err?.message || err);
  });
  fetchAllBloggerPages().catch(() => {});

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ssegu Movies (Firimu) running at http://localhost:${PORT}${BASE_PATH}/`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Ssegu Movies server:', err);
  process.exit(1);
});
