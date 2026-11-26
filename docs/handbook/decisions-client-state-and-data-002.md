## Client state and data

| If you need… | Use | Not |
| ------------ | --- | --- |
| Filters, view mode, derived release lists on the client | **Jotai** ([`src/atoms/`](../../src/atoms/), [`useFilterAtoms`](../../src/hooks/useFilterAtoms.hook.ts) / [`useViewAtoms`](../../src/hooks/useViewAtoms.hook.ts)) | Duplicating filter state in context |
| OAuth session, theme, collection **pagination metadata** | **Context + `useReducer`** | Jotai for session lifecycle |
| Crates/playlists/prefs/release detail from the server | **React Query** hooks in [`src/hooks/queries/`](../../src/hooks/queries/) + mutations in [`src/hooks/mutations/`](../../src/hooks/mutations/) | Raw `fetch` in components |
| Crate drawer, active crate, layout mutations | **`CrateProvider`** + React Query | Local crate copies without invalidation |
| Many subscribers to UI-only derived state | **Jotai atoms** | New context for every toggle |
| Persisted filter/view prefs on the client | **`atomWithStorage`** + keys in [`storageKeys.ts`](../../src/constants/storageKeys.ts) | Ad-hoc `localStorage` keys |

Details: [patterns.md → Provider stack](patterns.md#provider-stack), [architecture.md → Client state](architecture.md#tech-stack).

