## Moving parts

| Route | Data loader | Client hook / UI |
| ----- | ----------- | ---------------- |
| `/playlist/[id]` | [`getPublicPlaylistForPage`](../../../src/lib/public-playlist.server.ts) → [`loadPublicPlaylist`](../../../src/lib/public-playlist-load.server.ts) | [`usePublicPlaylistQuery`](../../../src/hooks/queries/usePublicPlaylistQuery.ts), [`usePublicPlaylistReleases`](../../../src/hooks/usePublicPlaylistReleases.hook.ts) |
| `/crate/[id]` | Public crate server helpers + `usePublicCrateQuery` | [`PublicCrateClient`](../../../src/components/PublicCrate/PublicCrateClient.component.tsx) |
| `/release/[id]` | [`loadPublicReleaseDiscogsDetailForPage`](../../../src/lib/public-release-discogs-detail.server.ts) | [`PublicReleasePage`](../../../src/components/PublicReleasePage/PublicReleasePage.component.tsx) |

Playback: logged-out visitors use [`PublicSharePlaybackShell`](../../../src/components/PublicSharePlaybackShell/PublicSharePlaybackShell.component.tsx); signed-in users share the same provider via [`AuthenticatedProvidersGate`](../../../src/components/AuthenticatedProvidersGate.component.tsx). See [playback.md](playback.md).

