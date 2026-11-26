**Do not:** write tests that mirror private implementation details, assert on query observer state in feature specs, weaken assertions to greenwash a red build (see **Behavior first** above), or add gate-only tests with no behavioral assertion.

### Page object pattern

- **Base class**: [`src/tests/BasePageObject.po.ts`](../../src/tests/BasePageObject.po.ts).
- **Per-component page object** (when useful): `<Name>.po.tsx` extends `BasePageObject`, sets **`testId = "fmd<ComponentName>"`**, holds **test data, mocks, and setup/render helpers only**—**not** wrappers around every `screen.getBy*`. **POs never assert and never call `screen.find*` / `getBy*` / `queryBy*` / `waitFor`.**
- **Render helpers**: Set component defaults on the JSX element, then spread overrides: `{...overrides}`. Do **not** use conditional spreads like `{...(overrides.foo !== undefined && { foo: overrides.foo })}`.
- **Shared element helpers**: When `render*` and `rerender*` need the same JSX, extract a private `*Element(overrides)` method and reuse it—specs call `po.rerender*(rerender, overrides)`, not `rerender(<Component />)` directly.
