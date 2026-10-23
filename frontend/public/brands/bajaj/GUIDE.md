# Forevate demo data: Bajaj Sri Lanka (DPMC)

Built 21 October 2026 from the Lazy Suzy research export (`david-pieris.zip`, 8,532 scraped Facebook and TikTok posts, 104 live signals) plus public sources. Upload this folder with the doc **Forevate – Interface Structure & UX Views**.

## Files

| File | What it is | Use it for |
|---|---|---|
| `forevate_bajaj_srilanka_real.json` | The dashboard data. One top-level key per tab, each starting with `so_what`. | Everything the screens show |
| `evidence_posts.jsonl` | 305 real posts referenced in the JSON: URL, author, date, likes/comments/shares, language, text, original-language text, province, SKUs, signal ids | The evidence panel ("open the post") |
| `signals_full.json` | The 77 kept signals with their evidence posts | Drill-down from an insight card to its signal |
| `GUIDE.md` | This file | — |

## Plain language

All text written for the dashboard (insights, signals, summaries, labels, notes) is in plain language. Raw posts are shown exactly as posted and are never edited.

Every signal has three fields:

- `title`: who is doing what, with a number where there is one.
- `what_we_see`: one or two sentences of observable facts.
- `what_it_means_for_brand`: one sentence on what it means for Bajaj.

## What is real and what is demo

**Real (every item has a link):**
- All social posts, with URL, author, date and engagement.
- All 77 signals with sentiment, confidence and evidence posts. `rank` is the signal's position in the export's index.
- Registrations, DPMC prices, CBSL financing directions, fuel prices, inflation, policy rate and the Budget date, in `sources` (ids `R01`–`R30`).
- Brand metrics in `my_brand`; methods in `my_brand.data_basis`.

**Demo (marked `"demo": true`, links to demo.forevate.ai):** `my_customers`; `my_demand` except rows marked `"real": true`; `deep_research.past_research` and `research_partners`.

## How the ids link

- `INS-01`…`INS-08` are insight cards in `insights.detailed_insights`; each card's `evidence` holds `signals`, `posts` and `public_sources`.
- Signal ranks appear throughout; resolve them in `signal_index` or `signals_full.json`.
- SKU ids: `RE-EFI`, `RE-CARB`, `E3W`, `CT100`, `PLAT100`, `DISC125`, `N125`, `N160`, `NS200`, `P220F`, `P135LS`, `CHETAK`, defined in `settings.skus`.
- Persona ids `P1`–`P5` are in `my_personas.personas`.

## The eight insight cards

1. TVS overtook Bajaj because of scooters, and Chetak is barely talked about. (INS-01)
2. Dealers sell the carburettor RE at Rs. 1,889,000, so buyers question the EFi's Rs. 2,075,000 price. (INS-02)
3. Fuel costs push drivers toward electric three-wheelers, but only dealers are talking about them. (INS-03)
4. Dealers make 41% of Bajaj posts, but riders' own posts get 1.5× more engagement. (INS-04)
5. Young buyers still look for the discontinued Pulsar 135LS; the N125 could replace it. (INS-05)
6. Jaffna dealers are launching a Pulsar 220F not on DPMC's published line-up; the supply route is unconfirmed. (INS-06)
7. A proposed age-40 limit for tuk drivers and a January public pay rise both affect Bajaj buyers. (INS-07)
8. Lease borrowers celebrate the end of forced repossession, so easy-finance ads may put buyers off. (INS-08)

## Brand-specific display settings

Nothing brand-specific is hard-coded in the app; it reads these keys. Missing keys fall back to neutral wording or hide the block.

In `manifest.json`: `currency_prefix`, `as_of`, `sales_unit`, `real_anchor`, plus `research_example` (placeholder question in Deep Research), `research_due_default` (default "needed by" date) and `integrations_hint` (closing sentence of the Integrations summary).

In `data.json`: `my_market.key_number_labels` (`{key: [label, unit, source type]}` for each series in `key_numbers`), `my_personas.persona_fields` (`[[label, key, suffix?]]` rows shown under "Who they are"), `my_competitors.registrations_monthly` with `registrations_meta` (`title`, `kpi_label`, `unit_noun`, `takeaway_template` using `{leader} {me} {month} {leader_n} {me_n}`) and `my_competitors.segment_share` (`label`, `share_pct`, `ours`, `rivals: [{name, value}]`, `source`).

## Caveats

- Share of conversation is within a Bajaj-weighted scrape; show the trend, not the level.
- Sentiment is signal-level, weighted by engagement.
- Author type (dealer / news / organic) is a heuristic on account names.
- Province comes from town names in post text; 35% of Bajaj posts name a place.
- 27 of the 104 signals were excluded as off-topic.
- Competitor prices were not published in the monitored posts and are left empty.
