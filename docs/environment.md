# Environment and Secret Boundaries

The current implementation uses the production Cloudflare Pages project for deployment. Separate local and preview environments are not provisioned at this time.

- Local-only values belong in ignored `.env.local` files.
- Production secrets belong in the Cloudflare Dashboard secret store.
- Never commit OAuth secrets, API tokens or private service credentials.
- Public configuration may be exposed only when it is intentionally public.
- The application is static by default and currently requires no server-side secret.

This production-only workflow is temporary and increases the risk of accidental public changes. Client handover must transfer the repository, Cloudflare project and custom domain through a recorded checklist.
