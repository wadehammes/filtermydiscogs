## App Router and components

| If you need… | Use | Not |
| ------------ | --- | --- |
| Route metadata, static shells | Thin server **`page.tsx`** | Business logic in server page |
| Interactive collection/crate/playback UI | Co-located **`*Client.tsx`** static-imported from `page.tsx` | `next/dynamic` on core `*Client` chunks (Turbopack dev breakage) |
| Loading UI during navigation | Segment **`loading.tsx`** + shared loaders | Client-only spinners that fight PPR |
| Pathname only on click (e.g. support toast) | **`window.location.pathname`** in the handler | **`usePathname`** at render when avoidable |
| New component folder | **`pnpm scaffold <Name>`** | Hand-authored folder trees |

Details: [architecture.md](architecture.md), [components.md](components.md), [platform.md → PPR](platform.md).

