# Conventions

House style for TypeScript, React, CSS, and tests so the repo reads consistently. When something here conflicts with a local shortcut, follow the doc (or open a PR to change the doc if the rule is wrong).

If you are unsure, copy a nearby file that already does the right thing and run **`pnpm lint`** and **`pnpm tsc:ci`** before you push.

## TypeScript

- **Blank line after declarations.** After `const` / `let` declarations in a function or block, leave one blank line before the next statement when that statement is control flow (`if`, `for`, `while`, `switch`, `try`) or a `return` (or other logic that is not another declaration). Do not insert a blank line between consecutive declarations that form one setup block.

```ts
const username = searchParams.get("username");

if (!username) {
  return NextResponse.json({ error: "Username is required" }, { status: 400 });
}
```

- **Use arrow functions always.** Prefer `const fn = () => {}` over `function fn() {}` for components and helpers. **Exception:** Next.js route handlers and some `page.tsx` / `layout.tsx` exports may use `export async function GET` or `export default function Page` where the framework expects it.
- **If blocks always use `{}`.** Same for `else`, `for`, `while`, and `do`—never omit braces for single-line bodies.
- **Never use `any`.** Use proper types for props, state, and function signatures.
- **Components**: Use arrow functions where you control the export (e.g. `export const MyComponent = (props: Props) => { ... }`). Do not use `React.FC` / `FC` in new code; prefer typed props on arrow components. When editing older context files that still use `FC`, match the surrounding file unless you are refactoring that module.
- **Never use non-null assertion (`!`).** Use optional chaining, nullish coalescing (`??`), or explicit checks instead.
- **Omit redundant return types** when the compiler can infer them. Add return types only for public API clarity or when inference would be wrong or unclear.
- **No nested ternaries.** Use `if`/`else` or extract to a variable or helper. A single ternary is fine; nesting is not.
- **No barrel files.** Do not add `index.ts` (or `index.tsx`) that re-export from other modules under `src/`. Import directly from the target file (e.g. `from "src/components/ReleaseCard/ReleaseCard.component"`).
- **Absolute imports (`src/…`).** Import application TS/TSX with paths rooted at `src/`. Do not use `../` across `src/` boundaries unless an exception below applies.
- **Exceptions to absolute imports:** (1) **CSS Modules** and static assets co-located with the importer (e.g. `import styles from "./MyComponent.module.css"`). (2) **Factory imports** within `src/tests/factories/` may use relative imports to sibling factories.
- **Do not re-export types (or values) from another module** just to shorten import paths. Consumers import from the defining module. Do not re-export types from a component file; use `src/types/` or a colocated `*.types.ts` if needed.
- **Single params object** for helpers, hooks, and any function with more than one argument or optional arguments (e.g. `useDiscogsCollectionQuery({ username, enabled })`, `getResourceUrl({ resourceUrl, type })`) so call sites are self-documenting. Define an interface for params in the same file when it helps.
- **Semantic parameter and variable names.** Describe what the value *is*, not generic placeholders like `raw`, `data`, `val`, `tmp`.
- **App-level types**: Shared types live under [`src/types/`](../../src/types/) (e.g. [`index.ts`](../../src/types/index.ts), [`crate.types.ts`](../../src/types/crate.types.ts)). Type-only modules belong here, not under `src/utils/`.
- **API payloads**: Define request/response types next to the feature or under `src/types/` when shared.
- **Constants**: App-wide literals (sort enums, storage keys) live in [`src/constants.ts`](../../src/constants.ts). Use `src/utils/` for functions; use `src/constants.ts` for shared immutable values.
- **Discogs usernames**: Validate with **`isValidDiscogsUsername`** from [`src/lib/discogs-username.ts`](../../src/lib/discogs-username.ts) in route handlers—do not duplicate ad-hoc regex (see [discogs.md](discogs.md)).

## React / JSX

Plain functions with typed props—no `React.FC` in new code—and explicit conditionals so we never accidentally render a stray `0` or `false`.

- **Conditional components**: Use a ternary (`condition ? <Component /> : null`) instead of short-circuit (`condition && <Component />`) when the condition could render a falsy value (e.g. `0`). Write multi-line ternaries—each branch on its own line(s).
- **Multiple or conditional class names**: Use **`classnames`** (import as `classNames`). Prefer **object notation** for conditionals: `classNames(styles.a, { [styles.active]: isActive })`. Static lists: `classNames(styles.a, styles.b)`. Optional `className` prop: `classNames(styles.container, className)`.
- **Raster images**: Use **`next/image`**. Avoid bare **`<img>`** except rare documented exceptions. Every **`Image`** needs **`alt`**. Discogs covers use **`i.discogs.com`** (allowlisted in `next.config.ts`).
- **Links**: Use **`next/link`**’s **`Link`** for navigational links—internal paths and external URLs—not a bare **`<a>`** unless you have a rare, documented exception. For new tabs, set **`target`** and **`rel="noopener noreferrer"`**.
- **Context + reducer** for cross-page UI state; **React Query** for server-backed data (see [patterns.md](patterns.md)).

### Large components and state

- **Extract state into a custom hook** when a component accumulates several `useState` / `useEffect` calls and derived values. Colocate **`useMyFeatureState.ts`** (or similar) in the component folder; return one object of state and handlers; keep the `.component.tsx` file focused on composition and JSX.

## Formatting and linting

**Biome** is the single source for JS/TS lint and format. **Stylelint** covers CSS.

- **Braces**: Always `{}` for control flow, including single-line bodies. No `if (!x) return null` on one line—use a block.
- **Commands**:
  - `pnpm lint` — Biome check
  - `pnpm lint:fix` — `biome check --fix`
  - `pnpm lint:check` — Biome on changed files since `origin/main`
  - `pnpm lint:css` / `pnpm lint:css:fix` — Stylelint over `src/**/*.css`
  - `pnpm lint:all` — `lint:check` then `lint:css:fix`
  - `pnpm tsc:ci` — strict TypeScript
- **Configs**: [`biome.json`](../../biome.json), [`stylelint.config.ts`](../../stylelint.config.ts).
- **CI**: `pnpm lint:ci`, `pnpm lint:css`, `pnpm test:ci` (see [platform.md](platform.md)).

## CSS and styling

### Technology

- **CSS Modules** (`.module.css`) co-located with the component.

### File naming

- **`MyComponent.component.tsx`** + **`MyComponent.module.css`**. Use the `styles.*` object in TSX.
- **Shared style modules** under [`src/styles/`](../../src/styles/) (e.g. [`nav-links.module.css`](../../src/styles/nav-links.module.css), [`segmented-control.module.css`](../../src/styles/segmented-control.module.css)) for cross-component patterns. Import directly from the module path; do not re-export through barrel files.

### Modern CSS

- **Nesting**: Use for scoped rules and nested `@media`. Avoid **deep** nesting; split into top-level full selectors when a block grows large.
- **Custom properties**: Prefer theme tokens from [`src/styles/themes/`](../../src/styles/themes/) and globals from [`src/styles/global.css`](../../src/styles/global.css) over magic numbers.
- **Modern features**: Use `color-mix()`, `clamp()`, etc. when they simplify layout or typography.

### Mobile-first

- **In CSS**: `@media (min-width: …)` from small screens up.

### Style rules

- **Alphabetize** properties within each rule block.
- **Nest** sensible selectors (`&:hover`, `&.modifier`); keep structural nesting shallow.
- **Selector order**: Put **base** class rules **before** more specific compound selectors (e.g. **`.artistLine`** before **`.titleGroupMobile .artistLine`**) so Stylelint **`no-descending-specificity`** passes.
- **Spacing**: Avoid **`margin-top`** for stacking siblings; prefer **flex/grid** with **`gap`**.
- No redundant comments in CSS; names and structure should read clearly.

### Typography

Two typefaces, used by role—not ad hoc per component:

| Role | Token | Use for |
|------|--------|---------|
| **Sans (Assistant)** | `--font-family-body` / `--font-family-heading` | Body copy, headings, buttons, form controls, descriptions |
| **Mono (JetBrains Mono)** | `--font-family-meta` | Eyebrows, stats, metadata, loading/status text, fine print |

Mono text uses **`--text-meta-*`** size tokens (2px smaller than the matching **`--text-*`** scale) because JetBrains Mono runs large at equal pixel sizes. Example: **`--text-meta-xs`** for captions and **`--text-meta-sm`** for compact meta lines (e.g. releases header “Showing X releases” count).

- **Default**: `html` / `body` set `--font-family-body`. Headings inherit `--font-family-heading` (same sans stack). Buttons and inputs use **`font-family: inherit`**.
- **Shared classes**: [`src/styles/typography.module.css`](../../src/styles/typography.module.css) — `brandEyebrow`, `sectionEyebrow`, `displayHeading`, `lead`, `sectionHeading`, `subsectionHeading`, `bodyText`, `metaCaption`. Compose with local layout classes (width, alignment) in component modules. Screen-reader-only text uses [`src/styles/accessibility.module.css`](../../src/styles/accessibility.module.css) (`.visuallyHidden`).
- **Do not** set `var(--font-assistant)` or `var(--font-mono)` directly in component CSS—use the semantic tokens above or shared typography classes.
- **Nav and segmented controls** (ViewToggle, theme switcher) use **`--nav-link-font-family`** / **`--nav-link-font-size`**, which map to the sans stack.
- **Exceptions**: Some dense UI keeps **`--text-xxs`** (not `--text-meta-*`) even with mono—e.g. release catalog pills (`.metaCatalog` in `ReleaseCardMeta.module.css`). Prefer meta tokens for new mono lines unless the design needs the extra-small sans-scale size.

## Testing

Jest with **jsdom** ([`jest.config.ts`](../../jest.config.ts), [`.jest/setupTests.ts`](../../.jest/setupTests.ts)). Prefer **`screen`** and **`userEvent`** in specs.

### Page object pattern

- **Base class**: [`src/tests/BasePageObject.po.ts`](../../src/tests/BasePageObject.po.ts).
- **Per-component page object** (when useful): `<Name>.po.tsx` extends `BasePageObject`, sets **`testId = "fmd<ComponentName>"`**, holds **test data, mocks, and setup/render helpers only**—**not** wrappers around every `screen.getBy*`. **POs never assert and never call `screen.find*` / `getBy*` / `queryBy*` / `waitFor`.**
- **Render helpers**: Set component defaults on the JSX element, then spread overrides: `{...overrides}`. Do **not** use conditional spreads like `{...(overrides.foo !== undefined && { foo: overrides.foo })}`.
- **Shared element helpers**: When `render*` and `rerender*` need the same JSX, extract a private `*Element(overrides)` method and reuse it—specs call `po.rerender*(rerender, overrides)`, not `rerender(<Component />)` directly.
- **Mocks in POs**: Put `jest.mock(...)` in the PO when the component depends on context or modules. Specs import the **PO first** (before the component) so mocks apply before the component module loads. When production wraps the component in a layout and server footer, the PO **`render*`** helper should use the same wrapper and mock server-only children (see [components.md → Testing](components.md#testing)).
- **Specs**: Use **`<Name>.spec.tsx`** for component tests with page objects (import the PO from **`src/components/<Name>/<Name>.po`**). Context, hook, and util tests may stay as **`* .test.ts(x)`** co-located with source. Import **`describe`**, **`it`**, **`expect`**, and lifecycle hooks from **`@jest/globals`** in every test file (not ambient globals). Use the global **`jest`** object for **`jest.mock`**, **`jest.fn`**, **`jest.spyOn`**, and **`jest.mocked`**—do **not** import **`jest`** from **`@jest/globals`** (that breaks the mock registry). Import Testing Library helpers from the **`test-utils`** alias. Jest DOM matchers are wired in [`.jest/setupTests.ts`](../../.jest/setupTests.ts) via **`@testing-library/jest-dom/jest-globals`**; types come from [`.jest/jest-dom-globals.d.ts`](../../.jest/jest-dom-globals.d.ts).
- **Assert on literal user-visible strings in specs**, not `po.someField` read back from the PO—repeat the literal in both PO factory/render setup and `screen.getBy*` / `expect` so coupling stays visible.
- **Custom render**: Use **`render`**, **`renderHook`**, and other Testing Library helpers from **`test-utils`** ([`src/tests/utils/test-utils.tsx`](../../src/tests/utils/test-utils.tsx)). Global styles load via **`src/styles/global.css`** in test-utils (same as rhythm-marketing). The default **`render`** wrapper is **`TestProviders`** (QueryClient, Jotai, theme, auth, collection, filters, crate, view). Pass a custom **`wrapper`** only when a test intentionally needs a subset (e.g. “outside provider” error cases).
- **`TestProviders` auth defaults**: **`skipInitialAuthCheck`** defaults to **`true`** so most component tests get a stable idle auth state without async **`checkAuthStatus`** updates (avoids act warnings). Pass **`skipInitialAuthCheck={false}`** only when testing real mount-time auth (e.g. **`auth.context.test.tsx`** with a minimal **`QueryClientProvider` + `AuthProvider`** wrapper). Optional **`authInitialState`** seeds **`AuthProvider`**; when **`skipInitialAuthCheck`** is **`false`** and **`authInitialState`** is omitted, production initial state (**`isCheckingAuth: true`**, **`isLoading: false`**) applies. Presets live in [`testAuthStates.ts`](../../src/tests/utils/testAuthStates.ts). Do **not** suppress act warnings in **`setupTests.ts`**—fix async provider setup instead.

### Jotai state in components

- **Read** filter/view slices via [`useFilterAtoms.hook.ts`](../../src/hooks/useFilterAtoms.hook.ts) and [`useViewAtoms.hook.ts`](../../src/hooks/useViewAtoms.hook.ts)—not **`useFilters()`** / **`useView()`** (Biome enforces this under `src/components/**`).
- **Write** filter actions via **`useFiltersDispatch()`**; view changes via **`useViewDispatch()`**.
- **Release list**: read **`useAllReleases()`** from filter atoms; only **`useCollectionData`** (and **`useCollectionReset`**) should dispatch **`SetAllReleases`**.
- **PO mocks**: when asserting dispatch in isolation, mock **`src/hooks/useFilterAtoms.hook`** (see `SearchBar.po.tsx`, `ReleaseCard.po.tsx`) rather than **`useFilters()`**.

### Test data and factories

See **[factories.md](factories.md)** for the full factory pattern (`BaseFactory`, `KeysMatch`, `nullish`, nested factories, one file per factory).

- Factories live only under **[`src/tests/factories/`](../../src/tests/factories/)**.
- Import singletons by path (e.g. `releaseFactory` from `src/tests/factories/Release.factory`).
- Override with `.build({ field: "literal" })` for values the spec asserts on.
- **Always use factories** in tests and POs—domain entities, API response shapes, and nested objects come from **`src/tests/factories/`**, not inline object literals.
- Use **preset methods** on factories for common test shapes (e.g. `releaseFactory.withDisplayDefaults()`, `cratesResponseFactory.empty()`) instead of ad-hoc PO builder methods or repeated inline `.build({ ... })` blocks.

### What to mock (and what not)

- **Don't mock**: Pure helpers under [`src/utils/`](../../src/utils/)—filter, sort, format, URL helpers. Let them run in component tests.
- **Don't mock React Query**: Use a real **`QueryClient`** from [`createTestQueryClient`](../../src/tests/utils/testQueryClient.tsx) via **`TestProviders`** (pass **`queryClient`** when a test needs to spy on cache behavior). Mock **`src/api/helpers`** and auth services instead so hooks and providers exercise real query/mutation wiring.
- **Do mock**: External dependencies—mock **`src/api/helpers`** with **`jest.mock("src/api/helpers")`** and configure responses via [`mockApiResponse`](../../src/tests/mocks/mockApiResponse.ts) (same helper as energy-texas). Use [`mockFetchResponse`](../../src/tests/mocks/mockFetchResponse.ts) for fetch-level tests of [`src/api/helpers.ts`](../../src/api/helpers.ts). Also mock auth cookies/services, `next/navigation`, `IntersectionObserver`, and similar.
- **Assertions**: Prefer asserting final DOM/output; avoid `expect(mockFn).toHaveBeenCalledWith(...)` when un-mocking—the output already proves wiring.

### Jest notes

- **Faker 10+** is ESM-only; transpiled via **`transpilePackages`** in `next.config.ts` (see [platform.md](platform.md)).
- **SVG**: mocked globally via [`.jest/__mocks__/svg.js`](../../.jest/__mocks__/svg.js).
- **fetchMock**: [`.jest/setupTests.ts`](../../.jest/setupTests.ts) enables and resets **`jest-fetch-mock`** each test (rhythm-marketing pattern).
- **PO mock reset**: Use **`jest.resetAllMocks()`** in PO constructors or **`setupMocks()`**.

## Test IDs

- Root element for tested components: **`data-testid="fmd<ComponentName>"`** (e.g. `fmdReleaseCard`). **PascalCase** matches the component name.
- Page object **`testId`** must match the component root **`data-testid`** so specs can use **`screen.getByTestId(po.testId)`**.
- Avoid generic roots like `data-testid="wrapper"` for primary surfaces.

## Accessibility

Baseline for keyboard and screen reader support.

- **Semantic HTML**: heading levels, **`<button>`** for actions, **`Link`** for navigation, lists for lists.
- **Forms**: Label inputs (`htmlFor` / `id`) or **`aria-label`** / **`aria-labelledby`** when there is no visible label.
- **Images**: Required **`alt`** on every **`Image`**; **`alt=""`** when decorative.
- **Keyboard**: Focusable controls; overlays/menus must not trap focus incorrectly.
- **Motion**: Honor **`prefers-reduced-motion`** for large or looping animations when practical.

## Comments

Avoid redundant comments. Prefer clear names and small functions. Comment only non-obvious behavior, workarounds, or business rules not visible from code.

## Editor

Use **2 spaces**, **UTF-8**, and **final newlines** so diffs stay clean.

## React Query

Keep **`useQuery` / `useMutation`** out of fat components—use dedicated hooks under **`src/hooks/queries/`**.

- **Dedicated hook file** per query or mutation (e.g. [`useDiscogsCollectionQuery.ts`](../../src/hooks/queries/useDiscogsCollectionQuery.ts)).
- **Query keys**: Centralized in [`querykeys.constants.ts`](../../src/hooks/queries/querykeys.constants.ts). Use key factories in hooks and in any **`invalidateQueries`** / **`setQueryData`** call sites.
- **Hook params: single object** (e.g. `useDiscogsCollectionQuery({ username, enabled })`) with a params interface in the same file.
- **Keep query hooks dumb**: `queryKey`, `queryFn`, `enabled`, `select`, etc. only—no `useEffect`, `onSuccess`, or `onError` inside query hook files. No `console.error` in `queryFn`.
- **Side effects at the call site**: Read `isError` / `error` in the component and react there (logging, toasts, etc.).
- **API layer**: Hooks call helpers in [`src/api/helpers.ts`](../../src/api/helpers.ts)—not raw `fetch` in hook files, not Discogs directly from the browser (see [patterns.md](patterns.md)).
