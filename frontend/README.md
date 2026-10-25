# Forevate Market Intelligence: frontend

A React + TypeScript + Vite port of the original single-file `index.html` dashboard. It is data-driven: every screen is drawn from the brand's files, so building for a new brand needs no code changes.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
npm run lint
```

## Brand data

Each build ships one brand. Its files live in a fixed folder, `public/brand/`, served as-is. The data pipeline writes this folder; nothing else in the app changes per brand:

```
public/brand/
  manifest.json              name, market, currency, file names, dashboard_url, digest recipients
  data.json                  one key per tab (insights, my_brand, my_personas, ...)
  signals.json               signals in full, with their evidence posts
  posts.jsonl                one real post per line, with its URL
  GUIDE.md                   field-by-field guide to the folder
```

To build for another brand, replace the contents of `public/brand/` and run `npm run build`. `docs/samples/` holds example brand folders (for example Munchee) to copy from.

## Source layout

```
src/
  main.tsx, App.tsx          providers + page shell
  styles/app.css             the original stylesheet, unchanged
  lib/                       pure helpers: data loading, formatting, lookups, filters, evidence, factors, digest
  store/                     AppContext (tab, filters, the loaded brand), UIContext (toast, modal), EvidenceContext (side panel)
  layout/                    Rail, Topbar, menus, popover and digest modal
  components/                shared pieces: Kpi, Card, charts, evidence panel, tooltip, feeling gauges
  views/                     one file per tab (Insights, Brand, Personas, Customers, Competitors + Sentiments,
                             Market, Demand, Research, Settings, Sources); views/index.tsx maps tab id -> view
digest/                      digest.js (shared with the Node mailer), send-digest.example.js, README.md
```

Notes:

- `data.json` is large and irregular, so its sections are typed loosely (`Json` in `lib/types.ts`).
- `digest/digest.js` is a UMD module used by both the browser (preview in the alerts menu) and the Node mailer; `digest/package.json` keeps that folder CommonJS so `require('./digest.js')` keeps working.
- Per-viewer conveniences (last tab) are kept in `localStorage` under `fv.*`.
- Deep links such as `#insights` or `#market` open that tab.
