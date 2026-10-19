# Test factories

Structured test data for Discogs releases, collections, and crates.

All factories live under **[`src/tests/factories/`](../../src/tests/factories/)** only. Specs and page objects import them by concrete path (e.g. `from "src/tests/factories/Release.factory"`). **No barrel `index.ts`.**

## Always use factories

**Default rule:** Any structured test data or mocked return value with a named type—domain entities, auth/session shapes, API payloads, nested objects—comes from a factory under **`src/tests/factories/`**, not an inline object literal in a spec or PO. This is a [Testing non-negotiable](conventions.md#non-negotiables-substantive-work-and-agents) alongside TDD and flat hook **`describe`** blocks—especially for **`src/hooks/*.hook.spec.ts(x)`** ([checklist](conventions.md#hook-and-feature-spec-checklist)). The same rule applies to **Playwright E2E** ([`e2e/`](../../e2e/) specs and [`e2e/helpers/`](../../e2e/helpers/)): compose MSW stubs with factories and shared E2E builders under [`src/tests/msw/`](../../src/tests/msw/) (e.g. [`buildE2eCollectionReleases`](../../src/tests/msw/e2eCollectionData.ts), [`buildE2eReleaseDetailByDiscogsId`](../../src/tests/msw/e2eReleaseDetailData.ts))—do not hand-roll **`DiscogsRelease`** / **`DiscogsReleaseDetail`** rows in helpers.

- **PO `setupMocks()`**, hook specs, route specs, and **E2E MSW helpers**: **`mockResolvedValue(authStatusFactory.authenticated())`**, **`userPreferencesFactory.defaultsApiResponse()`**, **`verifiedDiscogsUserFactory.asVerifiedResult()`**, etc.—not `{ isAuthenticated: true, username: "testuser", … }`.
- **Preset methods** (`authenticated()`, `empty()`, `forUser()`, `dashboardDefaults()`, …) exist for repeated shapes; prefer them over copying literals across files.
- **Missing factory?** Add one (see [Adding a new factory](#adding-a-new-factory)) or extend an existing factory with a preset—do not leave inline mocks for types that appear in more than one test file.

**Exceptions (inline literals are fine):**

- **Exact route JSON assertions** where the test documents a specific HTTP response contract (status codes, error bodies, rate-limit headers).
- **Minimal non-domain stubs** (`{ count: 0 }` from Prisma mocks, empty `{} as never` casts, `NextResponse.json({ error: "…" })`).
- **User-visible strings** duplicated in spec assertions (see [conventions.md → Testing](conventions.md#testing)—do not read literals back from the PO).

When adding a new **`AuthStatus`**, **`VerifiedUserResult`**, preferences wrapper, or similar field to a type, update the matching factory (and **`KeysMatch`** guard) in the same PR so tests stay typed.

## Base class

Every factory extends [`BaseFactory`](../../src/tests/factories/BaseFactory.ts):

- **`build(attributes?, options?)`** — one instance; pass **`Partial<Type>`** overrides for fields the test cares about ( **`releaseFactory`** uses **`ReleaseFactoryAttributes`** — see [`Release.factory.ts`](../../src/tests/factories/Release.factory.ts)).
- **`buildList(n, attributes?, options?)`** — array of `n` instances.
- **`buildModel`** — optional when a domain class wraps the built type.

## File and export naming

- **One factory per file**: `Release.factory.ts` → **`releaseFactory`** (camelCase singleton).
- **Options type** in the same file: `ReleaseFactoryOptions`, or `Record<string, never>` when there are no options.

## `build()` body (canonical shape)

```typescript
build(attributes?: FactoryOverrides<MyType>, _options?: MyFactoryOptions): MyType {
  const instance = {
    id: faker.string.uuid(),
    title: faker.music.songName(),
    // every declared field gets faker (or nested factory.build())
  } satisfies MyType;

  const factoryBuilt = mergeFactoryAttributes(instance, attributes);

  const _allKeysMustBeInTheInstance: KeysMatch<MyType, typeof instance> = undefined;

  return factoryBuilt;
}
```

Use **`FactoryOverrides<T>`** and **`mergeFactoryAttributes`** from [`mergeFactoryAttributes.ts`](../../src/tests/factories/mergeFactoryAttributes.ts) (also the **`BaseFactory.build`** attribute type). Under **`exactOptionalPropertyTypes`**, `Partial<T>` does not allow `field: undefined`. Overrides may pass **`duration: undefined`** (etc.) to **clear** a faker-filled optional field; **`mergeFactoryAttributes`** omits those keys on the result.
### `KeysMatch`

[`src/types/KeysMatch.ts`](../../src/types/KeysMatch.ts) fails the build if the target type gains a field the factory does not set. Use it on **closed** types (e.g. **`DiscogsCollection`**, **`Crate`** from Prisma).

**Skip `KeysMatch`** when the type has an index signature (e.g. **`[key: string]: unknown`** on Discogs API shapes like **`DiscogsRelease`**). Those types still use the same `instance` / `factoryBuilt` structure—just omit the guard line.

### Every field gets Faker data

Required, optional, and nullable fields in the `instance` literal must use **`faker.*`**, **`nullish`**, or nested **`.build()`**—not hard-coded defaults. Preset methods (e.g. **`withDisplayDefaults()`**) may set fixed literals for repeated component-test scenarios; tests that need a specific value still override with **`.build({ field: "literal" })`**.

### Nullable fields

Use **`nullish([value])`** from [`src/utils/factory.helpers.ts`](../../src/utils/factory.helpers.ts) for **`T | null`** fields so random builds exercise both branches:

```typescript
username: nullish([faker.internet.username()]),
master_url: nullish([`https://www.discogs.com/master/${masterId}`]),
```

Tests that need a fixed value pass **`.build({ username: "wadehammes" })`**.

For **optional** fields (`foo?: T`, not `T | null`), prefer **`faker.helpers.maybe(() => value)`** spread through **`definedProps({ ... })`** so absent keys stay omitted under **`exactOptionalPropertyTypes`**—do not use **`nullish`** (that yields **`null`**).
### Nested shapes

Compose existing factories—do not inline duplicate objects:

```typescript
basic_information: basicInformationFactory.build(),
formats: formatFactory.buildList(2),
releases: releaseFactory.buildList(10),
```

### `releaseFactory` overrides

- **`releaseFactory.build()`** and presets (**`withStyles`**, **`withResourceUrl`**, **`withDisplayDefaults`**, …) take **`ReleaseFactoryAttributes`**: release-level fields are partial, and nested **`basic_information`** is **`Partial<DiscogsBasicInformation>`** merged through **`basicInformationFactory.build()`**. Plain **`Partial<DiscogsRelease>`** is wrong for TypeScript—when **`basic_information`** is present it would require every BI field.
- Do **not** spread **`...release.basic_information`** or **`...releaseFactory.withStyles([…]).basic_information`** in specs. Override with **`releaseFactory.withStyles(styles, { basic_information: { … } })`**, **`basicInformationFactory.build({ … })`**, or a file-local helper that calls **`basicInformationFactory.build`** (see [`similarReleases.spec.ts`](../../src/utils/similarReleases.spec.ts)).
- **`formatFactory`**: when **`expect(…).toEqual`** on **`formats`**, reuse the same **`formatFactory.build()`** instance in the fixture and the assertion so Faker fields (**`qty`**, etc.) match ([`collectionCacheSync.spec.ts`](../../src/utils/collectionCacheSync.spec.ts), [`collectionReleaseLookup.spec.ts`](../../src/utils/collectionReleaseLookup.spec.ts)).
- **`artistFactory`** always sets **`resource_url`**. Specs that assert Discogs header links from **artist `id`** when the API URL is absent must pass **`resource_url: ""`** on **`artistFactory.build({ … })`** — [`getResourceUrl`](../../src/utils/helpers.ts) parses the id from **`resource_url`** first ([`ReleaseSummaryHero.spec.tsx`](../../src/components/ReleaseSummaryHero/ReleaseSummaryHero.spec.tsx)).
- **`getSimilarReleases`** (modal sidebar, playback similar-queue tail): partial BI alone leaves random Faker **styles**—use **`withStyles`** (or explicit shared tags) so candidates overlap the source ([`ReleaseModal.similar.spec.tsx`](../../src/components/ReleaseModal/ReleaseModal.similar.spec.tsx), [`useReleasePlaybackSimilarQueue.hook.spec.tsx`](../../src/hooks/useReleasePlaybackSimilarQueue.hook.spec.tsx)).

### Enum-like unions

Sample arrays cast to the field type (not `as const` alone on the whole tuple when the type is the source of truth):

```typescript
name: faker.helpers.arrayElement(FORMAT_NAMES), // FORMAT_NAMES as const, field typed as string
```

### Overrides in tests

- Override **only** fields the spec queries or asserts on.
- **Repeat literals in the spec**, do not read them back from the factory (see [conventions.md → Testing](conventions.md#testing)).
- Do not use `?? "fallback"` in assertions to paper over nullability.

## Options parameter

Use **`options`** for **build-time knobs** that are not part of the domain type—counts, pagination, etc.:

| Factory | Options | Purpose |
|---------|---------|---------|
| `releaseFactory` | `artistCount`, `labelCount`, `formatCount`, `styleCount` | Passed through to `basicInformationFactory` |
| `basicInformationFactory` | same | Control nested list sizes |
| `collectionFactory` | `releaseCount`, `page`, `totalPages`, `totalItems`, `username` | Pagination and page size |
| `crateFactory` | `userId`, `isDefault` | User scoping / default crate |

## Existing factories

| File | Singleton | Builds |
|------|-----------|--------|
| [`Artist.factory.ts`](../../src/tests/factories/Artist.factory.ts) | `artistFactory` | `DiscogsArtist` |
| [`Label.factory.ts`](../../src/tests/factories/Label.factory.ts) | `labelFactory` | `DiscogsLabel` |
| [`Format.factory.ts`](../../src/tests/factories/Format.factory.ts) | `formatFactory` | `DiscogsFormat` |
| [`BasicInformation.factory.ts`](../../src/tests/factories/BasicInformation.factory.ts) | `basicInformationFactory` | `DiscogsBasicInformation` |
| [`Release.factory.ts`](../../src/tests/factories/Release.factory.ts) | `releaseFactory` | `DiscogsRelease` |
| [`Collection.factory.ts`](../../src/tests/factories/Collection.factory.ts) | `collectionFactory` | `DiscogsCollection` |
| [`Crate.factory.ts`](../../src/tests/factories/Crate.factory.ts) | `crateFactory` | Prisma `Crate` |
| [`CrateRelease.factory.ts`](../../src/tests/factories/CrateRelease.factory.ts) | `crateReleaseFactory` | Prisma `CrateRelease` — **`release_data`** via [`toPrismaJsonValue`](../../src/utils/toPrismaJsonValue.ts); **`fromDiscogsRelease(release, …)`** for route/API mocks |
| [`CrateLayoutItem.factory.ts`](../../src/tests/factories/CrateLayoutItem.factory.ts) | `crateLayoutItemFactory` | Owner **`CrateLayoutItem[]`** rows (`marker` / `release`) for layout + section DnD lib specs |
| [`CrateWithCount.factory.ts`](../../src/tests/factories/CrateWithCount.factory.ts) | `crateWithCountFactory` | `Crate` + `releaseCount` (UI list shape) |
| [`SelectOption.factory.ts`](../../src/tests/factories/SelectOption.factory.ts) | `selectOptionFactory` | Select dropdown option |
| [`ReleaseNote.factory.ts`](../../src/tests/factories/ReleaseNote.factory.ts) | `releaseNoteFactory` | `ReleaseNote` |
| [`DiscogsCollectionField.factory.ts`](../../src/tests/factories/DiscogsCollectionField.factory.ts) | `discogsCollectionFieldFactory` | `DiscogsCollectionField` |
| [`DiscogsCollectionFieldsResponse.factory.ts`](../../src/tests/factories/DiscogsCollectionFieldsResponse.factory.ts) | `discogsCollectionFieldsResponseFactory` | `DiscogsCollectionFieldsResponse` |
| [`CratesResponse.factory.ts`](../../src/tests/factories/CratesResponse.factory.ts) | `cratesResponseFactory` | `CratesResponse` |
| [`CrateWithReleasesResponse.factory.ts`](../../src/tests/factories/CrateWithReleasesResponse.factory.ts) | `crateWithReleasesResponseFactory` | `CrateWithReleasesResponse` |
| [`CreateCrateResponse.factory.ts`](../../src/tests/factories/CreateCrateResponse.factory.ts) | `createCrateResponseFactory` | `{ crate: Crate }` API payloads |
| [`CrateMutationSuccess.factory.ts`](../../src/tests/factories/CrateMutationSuccess.factory.ts) | `crateMutationSuccessFactory` | Crate mutation success payloads |
| [`AuthStatus.factory.ts`](../../src/tests/factories/AuthStatus.factory.ts) | `authStatusFactory` | `AuthStatus` from [`auth.service`](../../src/services/auth.service.ts) |
| [`AuthUrlParams.factory.ts`](../../src/tests/factories/AuthUrlParams.factory.ts) | `authUrlParamsFactory` | `parseAuthUrlParams()` return shape |
| [`VerifiedDiscogsUser.factory.ts`](../../src/tests/factories/VerifiedDiscogsUser.factory.ts) | `verifiedDiscogsUserFactory` | `VerifiedDiscogsUser`, `VerifiedUserResult` |
| [`AuthenticatedDiscogsSession.factory.ts`](../../src/tests/factories/AuthenticatedDiscogsSession.factory.ts) | `authenticatedDiscogsSessionFactory` | Authenticated Discogs session (user + OAuth tokens) |
| [`CollectionValue.factory.ts`](../../src/tests/factories/CollectionValue.factory.ts) | `collectionValueFactory` | Dashboard collection value stats |
| [`DiscogsIdentity.factory.ts`](../../src/tests/factories/DiscogsIdentity.factory.ts) | `discogsIdentityFactory` | Discogs OAuth identity API shape |
| [`DiscogsSearchResponse.factory.ts`](../../src/tests/factories/DiscogsSearchResponse.factory.ts) | `discogsSearchResponseFactory` | `DiscogsSearchResponse` |
| [`AdminUserLookupStats.factory.ts`](../../src/tests/factories/AdminUserLookupStats.factory.ts) | `adminUserLookupStatsFactory` | Admin user lookup DTO |
| [`User.factory.ts`](../../src/tests/factories/User.factory.ts) | `prismaUserFactory` | Prisma `User` — **`preferences`** via [`toPrismaJsonValue`](../../src/utils/toPrismaJsonValue.ts) |
| [`UserPreferences.factory.ts`](../../src/tests/factories/UserPreferences.factory.ts) | `userPreferencesFactory`, `persistedFiltersFactory` | `UserPreferences`, `PersistedFiltersState`; **`asPrismaFindUniqueRow()`** / **`asPrismaFindUniqueDefaultsRow()`** for `findUnique({ select: { preferences: true } })` mocks |
| [`DiscogsReleaseJson.factory.ts`](../../src/tests/factories/DiscogsReleaseJson.factory.ts) | `discogsReleaseJsonFactory` | `DiscogsReleaseJson` |
| [`DiscogsTrack.factory.ts`](../../src/tests/factories/DiscogsTrack.factory.ts) | `discogsTrackFactory` | `DiscogsTrack` (release tracklist rows) |
| [`DiscogsVideo.factory.ts`](../../src/tests/factories/DiscogsVideo.factory.ts) | `discogsVideoFactory` | `DiscogsVideo` (release video links) |
| [`TrackYoutubeOverrideTarget.factory.ts`](../../src/tests/factories/TrackYoutubeOverrideTarget.factory.ts) | `trackYoutubeOverrideTargetFactory` | `TrackYoutubeOverrideTarget` for [`TrackYoutubeOverrideDialog`](../../src/components/TrackYoutubeOverrideDialog/TrackYoutubeOverrideDialog.component.tsx) specs |
| [`PlaybackSkipLogEntry.factory.ts`](../../src/tests/factories/PlaybackSkipLogEntry.factory.ts) | `playbackSkipLogEntryFactory` | **`PlaybackSkipLogEntry`** skip toast / report dialog / Sentry skip specs. Default **`errorCode`** is random (includes embed-unavailable watchdog fallback) — when asserting [`reportPlaybackSkipToSentry`](../../src/lib/sentry/reportPlaybackSkip.ts) **session cap** counts, override with a YouTube **`onError`** code (e.g. **`YOUTUBE_EMBED_ERROR_VIDEO_UNAVAILABLE`**) so watchdog skips are not counted. |

### Preset methods

Some factories expose **preset methods** for repeated test scenarios (still backed by `.build()`):

| Factory | Presets | Use when |
|---------|---------|----------|
| `releaseFactory` | `withDisplayDefaults()`, `withEmptyNotes()`, `withDateAdded()`, `withStyles()`, `withNamedFormats()`, `withResourceUrl()`, `withTitle()`, `withCoverImage()`, `withThumbOnly()`, `withNotes()` | Component tests assert on known titles, styles, URLs, images, or notes |
| `selectOptionFactory` | `defaultSelectOptions()` | Select PO default option list |
| `crateWithCountFactory` | `defaultTestCrate()`, `fromCrate()`, `defaultCrateSelectorCrates()` | Crate list UI shapes and CrateSelector PO defaults |
| `crateFactory` | `defaultTestCrate()`, `named()` | Default authenticated-user crate and named create flows |
| `crateLayoutItemFactory` | `marker()`, `release()`, `list()` | **`CrateLayoutItem[]`** fixtures in [`crate-layout.spec.ts`](../../src/lib/crate-layout.spec.ts), [`crate-section-layout.spec.ts`](../../src/lib/crate-section-layout.spec.ts), [`crate-layout.edge-cases.spec.ts`](../../src/lib/crate-layout.edge-cases.spec.ts), [`crate-layout.server.spec.ts`](../../src/lib/crate-layout.server.spec.ts) (group-delete → PUT pipeline), and [`CrateLayoutList.spec.tsx`](../../src/components/Crates/CrateLayoutList.spec.tsx) (section delete + layout DnD) |
| `crateReleaseFactory` | `forInstance()` | Prisma crate release rows in route specs |
| `cratesResponseFactory` | `empty()`, `withCrates()`, `withCrate()` | `fetchCrates` API response |
| `crateWithReleasesResponseFactory` | `empty()`, `withReleases()` | `fetchCrate` API response |
| `userTrackStatsResponseFactory` | `build()` | **`fetchTrackStats`** / **`GET /api/tracks/stats`** mocks (empty **`stats`** by default) |
| [`setupDefaultTrackStatsApiMock`](../../src/tests/mocks/setupDefaultTrackStatsApiMock.ts) | (helper, not a factory) | Stubs **`api.fetchTrackStats`** with empty **`stats`** for **`useTrackStatsQuery`** |
| [`setupFetchDiscogsReleaseMock`](../../src/tests/mocks/setupFetchDiscogsReleaseMock.ts) | (helper, not a factory) | Release-detail **`discogsRelease`** / batch mocks; also calls **`setupDefaultTrackStatsApiMock`** |
| [`setupDefaultCrateApiMocks`](../../src/tests/mocks/setupDefaultCrateApiMocks.ts) | (helper, not a factory) | PO / hook tests that mock **`src/api/urls`** and mount authenticated **`TestProviders`** without custom crate data—uses **`defaultTestCrate()`** presets above (includes track stats) |
| [`setupMswInJest`](../../src/tests/msw/setupMswInJest.ts) | (helper, not a factory) | MSW Jest lifecycle (registered globally via [`.jest/setupMswForApiSpecs.ts`](../../.jest/setupMswForApiSpecs.ts) for **`src/api/helpers.spec.ts`** and **`src/api/endpoints/*.spec.ts`**) |
| [`buildDefaultCrateApiFixtures`](../../src/tests/fixtures/defaultCrateApiFixtures.ts) | `build()` | Shared default crate list/detail/membership fixtures for MSW handlers and [`setupDefaultCrateApiMocks`](../../src/tests/mocks/setupDefaultCrateApiMocks.ts) |
| [`mutationSuccessFactory`](../../src/tests/factories/MutationSuccess.factory.ts) | `build()` | `{ success: true }` auth action responses (logout / clear-data MSW) |
| [`mswFetchTestHelpers`](../../src/tests/msw/mswFetchTestHelpers.ts) | **`jsonRoundTrip`**, **`mockFetchOnce`**, **`mockFetchJsonOnce`**, **`mockFetchErrorOnce`**, **`mockFetchEmptyOnce`**, **`mockFetchNetworkErrorOnce`**, **`expectLastFetchCalledWith`** | Per-test MSW stubs and fetch URL/body assertions; use **`jsonRoundTrip`** when comparing factory **`Date`** fields after **`response.json()`**; under **`jest-fixed-jsdom`**, **`expectLastFetchCalledWith`** treats Node **`fetch`** **`same-origin`** / **`default`** as **`include`** / **`no-store`** on captured **`Request`**s |
| [`createDefaultCrateApiHandlers`](../../src/tests/msw/handlers/crates.ts) / [`createDefaultAuthHandlers`](../../src/tests/msw/handlers/auth.ts) / [`createDefaultCollectionApiHandlers`](../../src/tests/msw/handlers/collection.ts) / [`createDefaultReleaseApiHandlers`](../../src/tests/msw/handlers/release.ts) (**`GET /api/release/:id`**, **`POST /api/release/batch`**) / [`createDefaultTrackApiHandlers`](../../src/tests/msw/handlers/tracks.ts) / [`createDefaultUsageApiHandlers`](../../src/tests/msw/handlers/usage.ts) (**`POST /api/usage/events`** → **`{ ok: true }`**) / [`createDefaultUserApiHandlers`](../../src/tests/msw/handlers/user.ts) / [`createDefaultDashboardApiHandlers`](../../src/tests/msw/handlers/dashboard.ts) | MSW handler presets | Composed by [`createAuthenticatedE2eHandlers`](../../src/tests/msw/createAuthenticatedE2eHandlers.ts) with [`buildE2eCollectionReleases`](../../src/tests/msw/e2eCollectionData.ts) for Playwright (**`e2e/fixtures/msw.fixture.ts`**); crate handlers mirror those releases on **`crate-1`** |
| `createCrateResponseFactory` | `forCrate()`, `named()` | `createCrate` / `updateCrate` API response |
| `crateMutationSuccessFactory` | `build()`, `sync()`, `clearPacked()` | Add/remove crate, sync, and clear-packed success payloads |
| `userPreferencesFactory` | `defaults()`, `asApiResponse()`, `defaultsApiResponse()`, `extendSimilarQueueDefaultsApiResponse()` | Account prefs mocks and `{ preferences }` API wrappers; E2E similar-queue tail uses **`extendSimilarQueueDefaultsApiResponse()`** (stable **`defaults()`** + **`extendQueueWithSimilarReleases: true`**) |
| `authStatusFactory` | `authenticated()`, `unauthenticated()` | Auth check / session mocks |
| `authUrlParamsFactory` | `empty()`, `authSuccess()`, `authError(code)` | OAuth URL param mocks |
| `verifiedDiscogsUserFactory` | `defaults()`, `asVerifiedResult()` | Verified user route / auth-request mocks |
| `authenticatedDiscogsSessionFactory` | `forUser()` | Collection routes with OAuth tokens |
| `collectionValueFactory` | `dashboardDefaults()` | Dashboard collection value mocks |
| `mostCratedReleaseFactory` | `fromRelease()` | **`MostCratedRelease`** rows for dashboard / MSW most-crated mocks |
| `topUserTrackFactory` | `fromRelease()` | **`TopUserTrack`** playback leaderboard rows |
| `topUserTracksResponseFactory` | `empty()`, `build()` | **`GET /api/dashboard/top-tracks`** payload shape |
| [`buildE2eCollectionReleases`](../../src/tests/msw/e2eCollectionData.ts) / [`buildE2eSimilarTailCollectionReleases`](../../src/tests/msw/e2eCollectionData.ts) | (E2E builder) | Three-release authenticated Playwright session; **`buildE2eSimilarTailCollectionReleases`** aligns peer genres/styles with album one via **`releaseFactory.build`** + **`basicInformationFactory`** for similar-queue E2E |
| [`e2eReleaseHandlers.ts`](../../src/tests/msw/e2eReleaseHandlers.ts) / [`e2eCollectionHandlers.ts`](../../src/tests/msw/e2eCollectionHandlers.ts) | (E2E MSW handler factories) | **`createE2eReleaseByIdHandler`**, **`createE2eDelayedReleaseBatchHandler`**, **`createE2eCollectionPageHandler`** — compose factory-built release/collection data for Playwright **`network.use`** |
| [`similarQueuePlayback.ts`](../../e2e/helpers/similarQueuePlayback.ts) / [`embedWatchdog.ts`](../../e2e/helpers/embedWatchdog.ts) | (E2E MSW helpers) | Thin Playwright wrappers over **`e2eReleaseHandlers`** / **`e2eCollectionHandlers`**; similar tail uses **`buildE2eSimilarTailCollectionReleases`** + **`userPreferencesFactory.extendSimilarQueueDefaultsApiResponse()`** |
| [`buildE2eDashboardMostCrated`](../../src/tests/msw/e2eDashboardData.ts) / [`buildE2eDashboardTopTracks`](../../src/tests/msw/e2eDashboardData.ts) | (E2E builders) | Playwright dashboard MSW; composes dashboard factories with stable E2E track titles |
| `discogsIdentityFactory` | `forUser()` | Discogs identity API mocks |
| `discogsSearchResponseFactory` | `empty()` | Search route empty results |
| `adminUserLookupStatsFactory` | `forUsername()` | Admin user lookup route spec |
| `adminStatsTopUserFactory` | `build()` | **`AdminStatsTopUser`** admin leaderboard rows |
| `adminStatsTopUserTrackFactory` | `build()` | **`AdminStatsTopUserTrack`** admin playback leaderboard rows |
| `fetchAdminUserTrackStatsResultFactory` | `build()`, `mappingFixture()` | **`FetchAdminUserTrackStatsResult`** + aligned **`$queryRaw`** SQL row mocks ([`admin-user-track-stats.server.spec.ts`](../../src/lib/admin-user-track-stats.server.spec.ts)) |
| `persistedFiltersFactory` | `empty()` | Default filter state in preferences tests |
| `discogsReleaseJsonFactory` | `forReleaseId()`, `withTracklistAndVideos()` | `api.discogsRelease` URI payload; detail shape with factory-built tracks/videos |
| `discogsTrackFactory` | `untitled()` | Tracklist rows; **`Untitled`** + **`type_: "track"`** for generic-title playback matching |
| `discogsVideoFactory` | `youtube()`, `nonYoutube()` | Embeddable YouTube links vs Discogs (non-YouTube) URIs |
| `trackYoutubeOverrideTargetFactory` | `unplayable()`, `fromReleaseTrack({ release, trackPosition, … })` | Dialog spec (**`unplayable()`**); modal playback hook expected override targets (**`fromReleaseTrack`**) |
| `playbackSkipLogEntryFactory` | `embedDisabledReport()`, `privateOrRemovedOnYoutube()`, `embedUnavailableFallback()`, `watchdogFallbackReport()` | Skip toast, **`PlaybackSkipReportDialog`**, embed-unavailable handler, and Sentry skip capture specs — override **`trackLabel`** / **`reason`** in specs that assert copy |
| `discogsCollectionFieldFactory` | `notesField()` | Notes field for release-notes editor tests |
| `discogsCollectionFieldsResponseFactory` | `forReleaseNotes()` | Collection fields API for notes editor |
| `collectionFactory` | `empty()`, `forReleasesPage()` | Empty collection pages; MSW **`/api/collection`** pagination aligned with client helpers |
| `releaseFactory` | `forNotesEditor()` | ReleaseNotes PO default release |

## Adding a new factory

1. Create **`src/tests/factories/<Name>.factory.ts`** extending **`BaseFactory`**.
2. Import **`faker`**, target type from **`src/types/`**, nested factories from **`src/tests/factories/`**.
3. Fill every field with **`faker.*`** or nested **`.build()`**; use **`nullish`** for nullable fields.
4. Add **`KeysMatch`** when the type has no index signature.
5. Export a **singleton** (`export const myTypeFactory = new MyTypeFactory()`).
6. Document the new row in the table above.

## What not to do

- Do not colocate factories under **`src/components/`**.
- Do not use **Rosie** or hand-maintained JSON fixtures when a factory would stay in sync with types.
- Do not share assertion strings via exported constants between PO and spec—duplicate literals intentionally.
- Do not hand-write inline mock objects for typed domain/API data when a factory or preset already exists (or should exist)—see [Always use factories](#always-use-factories).
