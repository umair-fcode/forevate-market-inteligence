# Brand folder contract

The frontend is built for one brand at a time. At the end of each pipeline step, the output is written to `frontend/public/brand/` and the frontend is rebuilt (`npm run build` in `frontend/`).

| File | Required | What it holds |
|---|---|---|
| `manifest.json` | yes | Brand identity (`id`, `name`, `organisation`, `market`, `category`), `currency`/`currency_prefix`, `as_of`, `files` (names of the other files), `dashboard_url`, display settings and digest `recipients` |
| `data.json` | yes | One top-level key per tab, each starting with `so_what` |
| `signals.json` | no | Signals in full, with evidence posts |
| `posts.jsonl` | no | One real post per line, with its URL |
| `GUIDE.md` | no | Field-by-field guide |

`frontend/public/brand/GUIDE.md` documents every field and the optional brand-specific display keys; missing optional keys fall back to neutral wording or hide the block. Mark illustrative values `"demo": true` and the app labels them on screen.

Working examples: `frontend/public/brand/` (Bajaj, Sri Lanka two- and three-wheelers) and `docs/samples/munchee/` (biscuits and snacks).
