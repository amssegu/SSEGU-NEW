# Phase 05 / Prompt 02 — Add restricted job sources only when approved

Implement ReliefWeb only with approved `appname`, terms and publisher attribution. Implement Himalayas only with unchanged `applicationLink`, correct salary period, expiry removal behaviour and an enforced `prohibit_jobposting_schema` rule.

Add tests proving restricted sources cannot bypass their policy through generic rendering, sitemap or JSON-LD helpers. If approval is absent, leave the adapter disabled and document the block rather than substituting scraping.
