# Forevate demo data: Munchee (Ceylon Biscuits Limited), Sri Lanka

Built 21 October 2026 from the Lazy Suzy research export (`munchee.zip`: 10,172 scraped Facebook and TikTok posts, 137 live signals) plus public sources. Upload this folder with the doc **Forevate – Interface Structure & UX Views**.

## Files

| File | What it is | Use it for |
|---|---|---|
| `forevate_munchee_srilanka_real.json` | The dashboard data. One top-level key per tab, each starting with `so_what`. | Everything the screens show |
| `evidence_posts.jsonl` | 363 real posts referenced in the JSON: URL, author, date, engagement, language, text, original-language text, SKUs, signal ids, `sri_lanka_context` | The evidence panel ("open the post") |
| `signals_full.json` | The 103 kept signals with their evidence posts | Drill-down from an insight card to its signal |
| `GUIDE.md` | This file | — |

## Plain language

All text written for the dashboard (insights, signals, summaries, labels, notes) is in plain language. Raw posts are shown exactly as posted and are never edited.

Every signal has three fields:

- `title`: who is doing what, with a number where there is one.
- `what_we_see`: one or two sentences of observable facts. Signals whose posts are mostly from outside Sri Lanka start with "Posts are mostly from outside Sri Lanka."
- `what_it_means_for_brand`: one sentence on what it means for Munchee.

## What is real and what is demo

**Real (every item has a link):** all social posts and signals; public facts (CBL background and market share, wheat flour prices, sugar levy, inflation, policy rate, Budget date, O/L exam dates, this week's rain advisory and power cuts) in `sources`, ids `M01`–`M19`; brand metrics in `my_brand`, with methods in `my_brand.data_basis`.

**Demo (marked `"demo": true`, links to demo.forevate.ai):** `my_customers`; `my_demand`; `deep_research.past_research` and `research_partners`.

## Things specific to this brand

- **Evidence scope.** Every signal carries `evidence_scope`: `Sri Lanka`, `mixed`, or `global pattern, no Sri Lankan post`. Cards use only Sri Lankan posts; show the scope on screen for the others.
- **Prices.** Shelf prices weren't found in public sources or posts; SKU prices are empty except Malt Up (Rs. 180–190 for 10–11 biscuits) and the Fun Mix box (Rs. 300), both from consumer and creator videos.
- **Province data is thin.** Only 13% of Munchee posts name a place.
- **Author types** include `recipe_or_creator_page`, because recipe pages are a large part of biscuit conversation.
- **Engagement.** 67% of Munchee posts come from consumers, but brand posts get slightly more engagement per post, led by one Black Edition video.
- **Competitor feed** labels Munchee's own activities that appear in competitor signals as "Munchee (own activity)".

## The eight insight cards

1. Malt Up spread by word of mouth faster than shops stocked it, so buyers went looking in small shops. (INS-01)
2. Buyers judge new biscuits on camera: price, pack count and how much chocolate they get. (INS-02)
3. Fans call the Super Cream Cracker "the GOAT" on their own, while "Life's Hunger" posts get no replies. (INS-03)
4. Tikiri Marie's campaign fits the O/L season, but only broadcasters are sharing it. (INS-04)
5. Maliban's Kriollo gets real taste-test videos, while Black Edition's buzz comes from brand events. (INS-05)
6. Recipe pages are posting copycat versions of Rollz. (INS-06)
7. Creators tell Maliban's founder story; Munchee's own history is not being told. (INS-07)
8. Office snack swaps and hostel meals are sharing occasions with no Munchee sharing pack. (INS-08)

## Brand-specific display settings

Nothing brand-specific is hard-coded in the app; it reads these keys. Missing keys fall back to neutral wording or hide the block.

In `manifest.json`: `currency_prefix`, `as_of`, `sales_unit`, `real_anchor`, plus `research_example` (placeholder question in Deep Research), `research_due_default` (default "needed by" date) and `integrations_hint` (closing sentence of the Integrations summary).

In `data.json`: `my_market.key_number_labels` (`{key: [label, unit, source type]}` for each series in `key_numbers`), `my_personas.persona_fields` (`[[label, key, suffix?]]` rows shown under "Who they are"). Competitor registrations (`registrations_monthly`, `registrations_meta`) and `segment_share` are optional and only needed when public registration data exists.

## Caveats

- Share of conversation is within a Munchee- and Maliban-weighted scrape; show the trend, not the level.
- Sentiment is signal-level, weighted by engagement.
- 34 of 137 signals were excluded as off-topic.
- The sugar levy figure is the last confirmed extension (November 2024).
