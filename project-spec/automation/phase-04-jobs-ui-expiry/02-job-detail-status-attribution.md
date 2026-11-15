# Phase 04 / Prompt 02 — Integrate job detail states and attribution

Update the existing job detail route/card and add minimal shared components for source attribution and expired notices. Render only verified optional fields, preserve original/application URLs, remove active CTAs for expired/withdrawn/unverified jobs and keep useful expired pages at stable URLs.

Emit `JobPosting` only for current, visible, source-permitted jobs. Include no markup for expired, withdrawn, unverified or source-flagged records. Keep internships separate unless explicitly classified.
