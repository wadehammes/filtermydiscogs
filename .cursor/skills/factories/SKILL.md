---
name: factories
description: >-
  Test data from src/tests/factories — build(), presets, no inline domain objects.
  Use in specs, POs, route tests, and e2e/helpers MSW stubs (via src/tests/msw builders).
---

# Factories

Full guide: [factories.md](../../docs/handbook/factories.md). Non-negotiable with TDD ([conventions](../../docs/handbook/conventions.md#non-negotiables-substantive-work-and-agents)).

## Rules

- Import by path: `src/tests/factories/Release.factory` — **no barrel `index.ts`**.
- **`factory.build({ … })`** — override only fields the test names; use **presets** (`authenticated()`, `empty()`, …) before copying literals.
- **Nested release detail:** **`discogsVideoFactory.youtube({ … })`**, **`discogsTrackFactory.build({ … })`** — CI **`handbookTestRules`** rejects inline **`embed: true`** / **`type_: "track"`** / bare YouTube **`uri:`** in specs and POs.
- New typed mock shape → add/extend a factory in the same PR.

## Common factories

| Need | Factory |
|------|---------|
| Release / collection row | `releaseFactory`, `collectionFactory` |
| Discogs API JSON | `discogsReleaseJsonFactory`, `discogsTrackFactory` |
| Track YouTube override dialog | `trackYoutubeOverrideTargetFactory` (`unplayable()`) |
| Playback skip toast / report | `playbackSkipLogEntryFactory` (`embedDisabledReport()`, …) |
| Auth / prefs | `authStatusFactory`, `userPreferencesFactory` (`extendSimilarQueueDefaultsApiResponse()` for similar-queue E2E), `verifiedDiscogsUserFactory` |
| Playwright MSW | `buildE2eCollectionReleases`, `createE2eReleaseByIdHandler`, `createE2eCollectionPageHandler` in `src/tests/msw/` |
| Crates | crate factories under [`src/tests/factories/`](../../src/tests/factories/) |

## Exceptions (inline OK)

- Exact HTTP contract assertions in route specs.
- Minimal Prisma stubs (`{ count: 0 }`), error JSON bodies.

## Adding one

Extend [`BaseFactory`](../../src/tests/factories/BaseFactory.ts): Faker on every field, `mergeFactoryAttributes`, `KeysMatch` when type is closed (skip for index-signature API shapes).
