# Forevate email digests

Two emails per brand, built from the same files the dashboard reads:

| Digest | When | What it contains |
|---|---|---|
| **What changed today** | every evening | The 3–5 most impactful changes since the previous evening (alerts, new early signs, competitor moves, market and cost changes), each with the facts, *What it means for \<brand\>* and a link to the evidence; insights that gained new evidence; what is coming in the next 7 days; decisions due this week. If a day is quiet the window stretches back up to 3 days and the email says so. |
| **Your week in market signals** | Monday morning | Where we stand (the decision scorecard and the week's numbers), the insights to act on with the first thing to do, the biggest early signs of the week, competitor moves, market changes, the next 2 weeks, decisions due, stock risks (demo until sales are connected). |

Every number, date and link comes from the brand's `data.json`, `signals.json` and `manifest.json`. Nothing is invented, and demo values keep their **Demo** tag.

## Files

```
digest/
  digest.js                 the builder + renderer (browser and Node, no dependencies)
  send-digest.example.js    reference mailer: loads a brand folder, builds, sends
  README.md                 this file
brands/
  index.json                brand list + dashboard_url (the login link in every email)
  <brand>/manifest.json     recipients[] for that brand (name, email, role, digests)
```

The dashboard embeds `digest.js` verbatim (between the `@@DIGEST-START@@` / `@@DIGEST-END@@` markers in `forevate.html`), so the preview a brand manager sees from the alerts pane is byte-for-byte what the mailer produces.

## API

```js
const { build, renderHtml, renderText } = require('./digest.js');

const model = build(data, {
  period: 'daily' | 'weekly',
  asOf: '2026-10-21',          // the run date; defaults to data._readme.as_of
  brand: manifest,             // brands/<id>/manifest.json
  signals: signalsJson.signals,// brands/<id>/signals.json (gives each signal its latest evidence date)
  dashboardUrl: index.dashboard_url,
  recipients: manifest.recipients,
  lookbackDays: 1              // daily only; stretches to 3 automatically when quiet
});

model.subject     // "Bajaj: what changed today — …"
model.preheader   // inbox preview text
model.recipients  // who gets it
renderHtml(model) // complete HTML email (600 px, tables, inline styles, no external CSS or images)
renderText(model) // plain-text alternative for multipart/alternative
```

`build()` is pure and deterministic. The model (`model.items`, `model.top`, `model.topInsights`, `model.upcoming`, `model.due`, `model.numbers`, `model.scorecard`) is plain JSON, so you can log it, store it for a "sent digests" history, or render it with your own template.

## How items are ranked

Each candidate gets a score; the top 5 are shown.

| Item | Score |
|---|---|
| Alert | Risk 100 · Watch 70 · Opportunity 60 |
| Early sign (signal) | 20 + confidence × 25 + log10(engagement) × 6, +10 if negative |
| Competitor move | 55 + log10(engagement) × 4 |
| Market change | 50 + log10(engagement) × 4 |
| Cost / key-number change | 45 |

Insights are ranked by status (Risk 3, Watch 2, Opportunity 1.6) × impact (High 3, Medium 2) × confidence. A signal that also appears as a market or competitor item is shown once.

## Wiring it into the backend

1. Keep the brand folders where the dashboard reads them (or copy them to the mailer).
2. Replace `deliver()` in `send-digest.example.js` with your provider.
3. Schedule two jobs per brand (Asia/Colombo): daily at 18:00, weekly Monday 08:00. Pass the real date as `asOf`.
4. The "Send today's digest" / "Send last week's digest" buttons in the dashboard's alerts pane currently build a preview and offer a download. To make them send, point them at an endpoint such as `POST /api/digests {brand, period, asOf}` that runs the same `build` + `renderHtml` server-side and mails `manifest.recipients`.
5. Deep links in the email use `dashboard_url` from `brands/index.json` plus a hash (`#insights`, `#brand`, `#competitors`, `#market`, `#demand`). Change `dashboard_url` when the dashboard moves.

Recipients are managed in each brand's `manifest.json`:

```json
"recipients": [
  { "name": "Brand Manager", "email": "bm@brand.lk", "role": "Brand manager", "digests": ["daily", "weekly"] }
]
```

Omit `digests` to receive both.
