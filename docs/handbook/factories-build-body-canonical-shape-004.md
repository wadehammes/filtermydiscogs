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

