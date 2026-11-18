# AdSense

AdSense is enabled for production builds using the configured publisher client and ad slot.
The publisher client and slot IDs are public values and are documented in `.env.example`.

Local development remains placeholder-only unless `PUBLIC_ADSENSE_ENABLED=true` is explicitly set.
Production builds enable the integration by default; set `PUBLIC_ADSENSE_ENABLED=false` to disable it.

The integration is consent-gated. The AdSense script and ad requests are only loaded after the
visitor accepts the site's advertising cookie notice. Visitors who decline continue to see the
reserved ad placement without an AdSense request.

To override the default public IDs in a deployment, configure `PUBLIC_ADSENSE_CLIENT` and
`PUBLIC_ADSENSE_SLOT` in the build environment, then redeploy.
