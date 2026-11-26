## Public vs authenticated surfaces

| Surface | Playback | Crate/playlist data |
| ------- | -------- | ------------------- |
| Authenticated app (`/collection`, `/crates/…`) | [`AuthenticatedProvidersGate`](../../src/components/AuthenticatedProvidersGate.component.tsx) | Full OAuth + private APIs |
| Public share (`/crate/[id]`, `/playlist/[id]`, `/release/[id]`) | [`PublicSharePlaybackShell`](../../src/components/PublicSharePlaybackShell/PublicSharePlaybackShell.component.tsx) when logged out | Public GET routes + SSR helpers |
| Marketing (home, about, legal) | No global playback shell | N/A |

Details: [patterns.md → Public share vs authenticated app](patterns.md#public-share-vs-authenticated-app).

