# Firimu app inside the SSEGU Astro site

The Firimu React application lives in `firimu-app/` and is built into
`public/firimu/`. Astro copies that directory unchanged into the Cloudflare
Pages output at `dist/firimu/`.

## Local development

```bash
npm install --prefix firimu-app
npm run dev --prefix firimu-app
```

The app is configured with the `/firimu/` base path. For local preview, use
Vite's development server; the live Blogger catalogue is fetched through the
`vj.ssegu.com` JSONP feeds when the optional `/firimu/api` service is absent.

## Production build

```bash
npm ci
npm install --prefix firimu-app
npm run build --prefix firimu-app
npm run build
```

The Firimu build writes only to `public/firimu/`. Its robots and sitemap files
are generated under that same directory. It does not write or replace the
main site's root `public/robots.txt` or `public/sitemap.xml`.

Cloudflare Pages serves `/firimu/` from the static files in `dist/firimu/`.
The `/firimu/*` SPA fallback is scoped to Firimu in `public/_redirects`.
The rest of the SSEGU site remains the existing Astro application.
