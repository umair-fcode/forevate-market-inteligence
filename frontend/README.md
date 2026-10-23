# Forevate Market Intelligence: frontend

A React + TypeScript + Vite port of the original single-file `index.html` dashboard. It is data-driven: every screen is drawn from a brand's files, so onboarding a brand needs no code changes.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
npm run lint
```

## Brands and data

Brands are folders under `public/brands/`, served as-is:

```
public/brands/
  index.json                 list of brands + dashboard_url (login link used in email digests)
  <brand>/manifest.json      name, market, currency, file names, digest recipients
  <brand>/data.json          one key per tab (insights, my_brand, my_personas, ...)
  <brand>/signals.json       signals in full, with their evidence posts
  <brand>/posts.jsonl        one real post per line, with its URL
  <brand>/GUIDE.md           field-by-field guide for building a brand folder
```

To add a brand: add its folder, then one entry in `index.json`. Or use the profile menu, **Add a brand**, to load `data.json` (and optionally `manifest.json`, `posts.jsonl`, `signals.json`) from your computer for the current visit.

## Source layout

```
src/
  main.tsx, App.tsx          providers + page shell
  styles/app.css             the original stylesheet, unchanged
  lib/                       pure helpers: data loading, formatting, lookups, filters, evidence, factors, digest
  store/                     AppContext (tab, filters, brand), UIContext (toast, modal), EvidenceContext (side panel)
  layout/                    Rail, Topbar, menus, popover, add-brand and digest modals
  components/                shared pieces: Kpi, Card, charts, evidence panel, tooltip, feeling gauges
  views/                     one file per tab (Insights, Brand, Personas, Customers, Competitors + Sentiments,
                             Market, Demand, Research, Settings, Sources); views/index.tsx maps tab id -> view
digest/                      digest.js (shared with the Node mailer), send-digest.example.js, README.md
```

Notes:

- `data.json` is large and irregular, so its sections are typed loosely (`Json` in `lib/types.ts`).
- `digest/digest.js` is a UMD module used by both the browser (preview in the alerts menu) and the Node mailer; `digest/package.json` keeps that folder CommonJS so `require('./digest.js')` keeps working.
- Per-viewer conveniences (last tab, last brand) are kept in `localStorage` under `fv.*`.
- Deep links such as `#insights` or `#market` open that tab.
