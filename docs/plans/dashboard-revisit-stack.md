# Dashboard revisit stack

Hub branch: **`11-26-dashboard-revisit`** (on **`11-26-fix-speed-insights`** → **`staging`**).

Handbook source of truth for current behavior: [patterns.md → Dashboard analytics](../handbook/patterns.md#dashboard-analytics).

## Stack order (bottom → top)

| #   | Branch                        | Goal                                                                                                          |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | `11-26-dashboard-revisit`     | Roadmap + stack hub (this doc)                                                                                |
| 2   | `11-26-dashboard-cwv`         | Load performance: **`usePaintDeferredMount`** below hero + This day / This week                               |
| 3   | `11-26-dashboard-drilldown`   | **`View in collection`** for duplicate groups only (charts stay read-only)                                    |
| 4   | `11-26-dashboard-freshness`   | Trust UX: `useCollectionLastSyncedLabel`, segment errors, hero value + top-tracks copy                        |
| 5   | `11-26-dashboard-tests`       | `DashboardClient` + `CollectionHealth` specs/PO, segment/freshness smoke, E2E value outage + duplicates modal |
| 6   | `11-26-dashboard-year-review` | **Copy recap** on existing **Collection recap** card (no duplicate year section)                              |

## Layer notes

### CWV

- Same collection gate as today (`useNeedsCollectionLoad`, `fetchingCollection`).
- Defer below-fold sections or heavy lists; keep hero + first narrative row fast.
- Reuse `scheduleAfterNextPaint`, lazy chart wrappers; avoid scroll-reveal on narrative blocks (handbook).

### Drill-down

- Duplicate groups → collection search for that cluster (`View in collection`).
- No chart legend / style chip navigation (confusing leave-dashboard UX).

### Freshness

- Align with Discogs outage / rate-limit patterns; no false “empty shelf” when APIs are transient.

### Tests

- Follow [conventions.md → Hook checklist](../handbook/conventions.md#hook-and-feature-spec-checklist); PO mocks for charts in component specs.

### Year review / share

- Do not add a second rolling-year block above the fold; reuse **Collection recap** in [`CollectionRhythm`](../../src/components/Dashboard/CollectionRhythm.component.tsx). Clipboard share: [`collectionRecapShare.ts`](../../src/utils/collectionRecapShare.ts).

## Workflow

```bash
gh stack sync
gh stack checkout 11-26-dashboard-cwv   # start implementation
# commit on layer → gh stack up → next layer
gh stack submit --auto                  # when ready for PRs
```
