# sakethchintala.github.io

Portfolio website for Saketh Chintala. This repository also hosts a featured
frontend project built to demonstrate clean architecture and modern UI
engineering practices.

## Featured Project

### RetailOps Command Center

Production-style retail operations dashboard with live KPI telemetry,
scenario planning, and alert orchestration.

- Live demo: `projects/retail-ops-command-center/`
- Architecture & setup: `projects/retail-ops-command-center/README.md`

## Local development

To preview the portfolio or the project locally, run a simple static server:

```bash
python -m http.server 5173
```

Then open:

```
http://localhost:5173
```

## SEO and analytics

- `robots.txt` and `sitemap.xml` are included for search indexing.
- Open Graph share cards are provided via `og-image.svg`.
- To enable GA4 analytics, set the `meta name="analytics-id"` value in
  `index.html`. The loader respects Do Not Track.
