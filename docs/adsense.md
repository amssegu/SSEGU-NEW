# AdSense pause

AdSense is intentionally disabled while the site and traffic are being reviewed. The publisher
client and slot IDs remain commented in `.env.example` for reference and have not been removed.

Ad placement containers remain visible as labelled `Ad space` placeholders so layout and placement
can be reviewed without creating an AdSense request.

The integration is fail-closed: ads only render when `PUBLIC_ADSENSE_ENABLED=true` and both
`PUBLIC_ADSENSE_CLIENT` and `PUBLIC_ADSENSE_SLOT` are configured. Until that review is complete,
do not set the enable flag in Cloudflare Pages or local production environments.

When re-enabling, confirm the live domain, consent/privacy requirements, ad placements, and traffic
quality first. Then configure the three variables in the deployment environment and redeploy.
