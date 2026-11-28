# Collection command — prompt scenario catalog

Living list of **user-written prompts** we regression-test without calling the AI gateway. Source: [`collectionCommandPromptScenarioMatrix.ts`](../../src/utils/collectionCommandPromptScenarioMatrix.ts) (executed by [`collectionCommandPromptScenarioMatrix.spec.ts`](../../src/utils/collectionCommandPromptScenarioMatrix.spec.ts)). Matrix and end-to-end scenario specs pin reference date **2026-11-27** (same as [`collectionCommandPromptYears.spec.ts`](../../src/utils/collectionCommandPromptYears.spec.ts) / [`collectionCommandPromptScenarios.spec.ts`](../../src/utils/collectionCommandPromptScenarios.spec.ts)). Extractor-only checks: [`collectionCommandPromptRules.spec.ts`](../../src/utils/collectionCommandPromptRules.spec.ts).

Each row mocks a **bad or empty LLM intent** and asserts **`applyCollectionCommandPromptRules`** output. Add new rows when users report misparses.

## What deterministic rules own

| Area | Example phrasing | Field(s) |
| ---- | ---------------- | -------- |
| Explicit years | `from 2018`, `in 2001`, `released in 2005`, `2012 releases`, `in 2018 and 2019`, `between 2015 and 2017` | `selectedYears` (clears bounds) |
| Relative years | `last two years`, `past 3 years`, `this year`, `last year` | `yearStartInclusive` / `yearEndExclusive` |
| Include style | `… X releases`, `X from YYYY`, `Filter to X releases`, `Electro and Deep House releases` | `selectedStyles` |
| Exclude style | `that aren't House`, `excluding Ambient`, `without Dub`, `except A and B`, `don't have Techno` | `excludedStyles` |

## Still LLM-first (add matrix rows only when rules must **not** clobber good output)

| Area | Example phrasing |
| ---- | ---------------- |
| Decades / fuzzy time | `from the 90s`, `80s house` |
| Before / after bounds | `before 2019`, `after 2000` (`yearEndExclusive` / `yearStartInclusive`) |
| Formats | `vinyl only`, `not on CD`, format `NONE` |
| Search / artist | `Moodymann`, `blue note pressings` (`searchQuery`) |
| Sort | `newest first`, `rating high`, `artist A–Z` |
| AND across styles | `Rock and Jazz` with `styleOperator: AND` |
| Crate / view intents | `save as …`, `crate for weekend gig` (other product surfaces) |

## Categories in the matrix

- **regression** — reported user bugs
- **year-explicit** / **year-relative** / **year-span** / **year-llm-bounds**
- **style-include** / **style-exclude** / **style-combined**
- **passthrough** — rules must leave LLM fields intact

## Ideas for future rows (not yet in matrix)

- `no techno` at sentence start (negation without `that`)
- `only vinyl` vs `vinyl only:` lead clause
- `imported` / `reissue` (search, not style)
- `highest rated house` (sort + style)
- `added this month` (date-added — v1 uses sort, not filter)
- Typos: `deephouse`, `deep hous`
- Multi-language genre names as stored in Discogs facets