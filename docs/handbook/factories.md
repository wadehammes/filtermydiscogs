# Test factories

Structured test data for Discogs releases, collections, and crates.

All factories live under **[`src/tests/factories/`](../../src/tests/factories/)** only. Specs and page objects import them by concrete path (e.g. `from "src/tests/factories/Release.factory"`). **No barrel `index.ts`.**

## Base class

Every factory extends [`BaseFactory`](../../src/tests/factories/BaseFactory.ts) (same shape as rhythm-marketing):

- **`build(attributes?, options?)`** — one instance; pass **`Partial<Type>`** overrides for fields the test cares about.
- **`buildList(n, attributes?, options?)`** — array of `n` instances.
- **`buildModel` / `buildListModel`** — optional when a domain class wraps the built type.

## File and export naming

- **One factory per file**: `Release.factory.ts` → **`releaseFactory`** (camelCase singleton).
- **Options type** in the same file: `ReleaseFactoryOptions`, or `Record<string, never>` when there are no options.

## `build()` body (canonical shape)

```typescript
build(attributes?: Partial<MyType>, _options?: MyFactoryOptions): MyType {
  const instance = {
    id: faker.string.uuid(),
    title: faker.music.songName(),
    // every declared field gets faker (or nested factory.build())
  } satisfies MyType;

  const factoryBuilt: MyType = {
    ...instance,
    ...(attributes ?? {}),
  };

  const _allKeysMustBeInTheInstance: KeysMatch<MyType, typeof instance> = undefined;

  return factoryBuilt;
}
```

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

### Nested shapes

Compose existing factories—do not inline duplicate objects:

```typescript
basic_information: basicInformationFactory.build(),
formats: formatFactory.buildList(2),
releases: releaseFactory.buildList(10),
```

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
| [`CrateWithCount.factory.ts`](../../src/tests/factories/CrateWithCount.factory.ts) | `crateWithCountFactory` | `Crate` + `releaseCount` (UI list shape) |
| [`SelectOption.factory.ts`](../../src/tests/factories/SelectOption.factory.ts) | `selectOptionFactory` | Select dropdown option |
| [`ReleaseNote.factory.ts`](../../src/tests/factories/ReleaseNote.factory.ts) | `releaseNoteFactory` | `ReleaseNote` |
| [`DiscogsCollectionField.factory.ts`](../../src/tests/factories/DiscogsCollectionField.factory.ts) | `discogsCollectionFieldFactory` | `DiscogsCollectionField` |
| [`DiscogsCollectionFieldsResponse.factory.ts`](../../src/tests/factories/DiscogsCollectionFieldsResponse.factory.ts) | `discogsCollectionFieldsResponseFactory` | `DiscogsCollectionFieldsResponse` |
| [`CratesResponse.factory.ts`](../../src/tests/factories/CratesResponse.factory.ts) | `cratesResponseFactory` | `CratesResponse` |
| [`CrateWithReleasesResponse.factory.ts`](../../src/tests/factories/CrateWithReleasesResponse.factory.ts) | `crateWithReleasesResponseFactory` | `CrateWithReleasesResponse` |
| [`CreateCrateResponse.factory.ts`](../../src/tests/factories/CreateCrateResponse.factory.ts) | `createCrateResponseFactory` | `{ crate: Crate }` API payloads |
| [`CrateMutationSuccess.factory.ts`](../../src/tests/factories/CrateMutationSuccess.factory.ts) | `crateMutationSuccessFactory` | Crate mutation success payloads |
| [`UserPreferences.factory.ts`](../../src/tests/factories/UserPreferences.factory.ts) | `userPreferencesFactory`, `persistedFiltersFactory` | `UserPreferences`, `PersistedFiltersState` (uses [`SortValues`](../../src/constants/sortValues.ts)) |
| [`DiscogsReleaseJson.factory.ts`](../../src/tests/factories/DiscogsReleaseJson.factory.ts) | `discogsReleaseJsonFactory` | `DiscogsReleaseJson` |

### Preset methods

Some factories expose **preset methods** for repeated test scenarios (still backed by `.build()`):

| Factory | Presets | Use when |
|---------|---------|----------|
| `releaseFactory` | `withDisplayDefaults()`, `withEmptyNotes()`, `withDateAdded()`, `withStyles()`, `withNamedFormats()`, `withResourceUrl()`, `withTitle()`, `withCoverImage()`, `withThumbOnly()`, `withNotes()` | Component tests assert on known titles, styles, URLs, images, or notes |
| `selectOptionFactory` | `defaultSelectOptions()` | Select PO default option list |
| `crateWithCountFactory` | `defaultTestCrate()`, `fromCrate()`, `defaultCrateSelectorCrates()` | Crate list UI shapes and CrateSelector PO defaults |
| `crateFactory` | `defaultTestCrate()`, `named()` | Default authenticated-user crate and named create flows |
| `cratesResponseFactory` | `empty()`, `withCrates()`, `withCrate()` | `fetchCrates` API response |
| `crateWithReleasesResponseFactory` | `empty()`, `withReleases()` | `fetchCrate` API response |
| [`setupDefaultCrateApiMocks`](../../src/tests/mocks/setupDefaultCrateApiMocks.ts) | (helper, not a factory) | PO / hook tests that mock **`src/api/urls`** and mount authenticated **`TestProviders`** without custom crate data—uses **`defaultTestCrate()`** presets above |
| `createCrateResponseFactory` | `forCrate()`, `named()` | `createCrate` / `updateCrate` API response |
| `crateMutationSuccessFactory` | `build()`, `sync()` | Add/remove crate and sync success payloads |
| `userPreferencesFactory` | `defaults()` | `/api/user/preferences` route tests and default account prefs |
| `persistedFiltersFactory` | `empty()` | Default filter state in preferences tests |
| `discogsReleaseJsonFactory` | `forReleaseId()` | `api.discogsRelease` URI payload |
| `discogsCollectionFieldFactory` | `notesField()` | Notes field for release-notes editor tests |
| `discogsCollectionFieldsResponseFactory` | `forReleaseNotes()` | Collection fields API for notes editor |
| `collectionFactory` | `empty()` | Empty collection pages |
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
