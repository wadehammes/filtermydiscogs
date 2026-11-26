# TypeScript (imports & types)

- **No pointless `*.interfaces.ts`.** Scaffold may emit **`Name.interfaces.ts`** — delete it when it would only re-export types already on the component or a colocated helper (see [components.md → Scaffolding](components.md#scaffolding)). Keep **`*.interfaces.ts`** only when it holds domain types shared by factories, POs, or multiple files in the folder.
- **Single params object** for helpers, hooks, and any function with more than one argument or optional arguments (e.g. `useDiscogsCollectionQuery({ username, enabled })`, `getResourceUrl({ resourceUrl, type, id })`) so call sites are self-documenting. Define an interface for params in the same file when it helps.
- **Semantic parameter and variable names.** Describe what the value _is_, not generic placeholders like `raw`, `data`, `val`, `tmp`.
- **App-level types**: Shared types live under [`src/types/`](../../src/types/) (e.g. [`index.ts`](../../src/types/index.ts), [`crate.types.ts`](../../src/types/crate.types.ts)). Type-only modules belong here, not under `src/utils/`.
- **API payloads**: Define request/response types next to the feature or under `src/types/` when shared.
- **Constants**: App-wide literals live in [`src/constants.ts`](../../src/constants.ts) and topic modules under [`src/constants/`](../../src/constants/) (e.g. [`sorting.ts`](../../src/constants/sorting.ts)). Use `src/utils/` for functions.
- **Discogs usernames**: Validate with **`isValidDiscogsUsername`** from [`src/lib/discogs-username.ts`](../../src/lib/discogs-username.ts) in route handlers—do not duplicate ad-hoc regex (see [discogs.md](discogs.md)).
- **`exactOptionalPropertyTypes`** (`tsconfig.json`): Optional props (`foo?: T`) may be **omitted** or set to `T`—never pass **`undefined`** explicitly.
  - **Factory `.build({ … })`**: Omit optional keys instead of **`undefined`** (e.g. SSR **`initialPublicPlaylist`** without **`viewerIsOwner`** — [`publicPlaylistViewerAccess.spec.ts`](../../src/utils/publicPlaylistViewerAccess.spec.ts) uses **`publicPlaylistResponseFactory.build({ playlist: … })`** only).
  - **`className`**: Pass CSS module tokens through **`classNames()`** (returns `string`; accepts `string | undefined`).
  - **Other optional props**: Spread **`definedProps({ ... })`** from [`src/utils/definedProps.ts`](../../src/utils/definedProps.ts) to drop `undefined` keys before spread.
  - **Do not** build props with sequential `if (value !== undefined) { props.key = value }` blocks, or conditional spreads like `{...(styles.foo ? { className: styles.foo } : {})}`.

```tsx
<ViewToggle
  currentView={currentView}
  onViewChange={onViewChange}
  className={classNames(styles.viewToggleMobile)}
  {...definedProps({ onCratesClick, isCratesOpen })}
/>

<CrateSelector className={classNames(styles.headerCrateSelector)} />
```
