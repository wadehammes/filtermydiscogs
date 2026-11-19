# Playback: queue, embed, and where the provider mounts

## What users experience

- Clicking play on a track starts YouTube (when a video id is known), keeps an iframe alive across client navigations, and shows the mini player dock.
- Public playlist pages support **Play All** and per-row play without logging in.
- Skipped/broken embeds surface toasts and optional user reports—not silent failure.

## Moving parts

| Piece | Role |
| ----- | ---- |
| [`ReleasePlaybackProvider`](../../../src/context/ReleasePlaybackProvider.component.tsx) | Session state, queue, iframe lifecycle |
| [`GlobalPlaybackDock`](../../../src/components/GlobalPlaybackDock/GlobalPlaybackDock.component.tsx) | Visible transport + queue UI |
| [`playbackSessionState.ts`](../../../src/utils/playbackSessionState.ts) | Discriminated union: idle / inactive / active |
| [`PlaybackProvidersShell`](../../../src/components/PlaybackProvidersShell.component.tsx) | Provider + dock bundle |

## Decisions & rationale

### One global queue, not per-page players

**Decision:** A single playback session in context; “up next” is `PlaybackQueueItem[]`, current track is not duplicated in that array.

**Why:** Users expect the mini player to survive route changes (`/collection` → release modal → `/playlist/...`). Recreating players per route would reset transport and break gesture rules on mobile Safari.

Details: [patterns.md → Release playback queue](../patterns.md#release-playback-queue), [playback-embed-invariants.md](../playback-embed-invariants.md).

### Two mount paths, one implementation

**Decision:**

- **Authenticated or checking on protected routes:** [`AuthenticatedProvidersGate`](../../../src/components/AuthenticatedProvidersGate.component.tsx) loads playback.
- **Logged-out public share URLs:** page-level [`PublicSharePlaybackShell`](../../../src/components/PublicSharePlaybackShell/PublicSharePlaybackShell.component.tsx).

**Why:** Logged-out protected routes should not pay for playback bundle size. Public share routes need the provider on first paint because hooks call `useReleasePlayback` immediately.

**Why not duplicate a “lite” player?** Same reducer, embed watchdog, and spec suite—`scope` splits are reserved for explicit future design.

### YouTube embed complexity lives in utils + themed specs

**Decision:** Keep provider hooks thin; put skip/watchdog/override resolution in [`src/utils/`](../../../src/utils/) with TDD.

**Why:** Embed edge cases (tab hidden, override-only tracks, queue growth during stats fetch) are easier to regression-test in pure utilities and [`releasePlayback.context.*.spec.tsx`](../../../src/context/) themes than in components.

## Code snapshot: session states

```ts
// playbackSessionState.ts (conceptual)
type PlaybackSessionState =
  | { status: "idle" }
  | { status: "inactive"; releaseId: string }
  | {
      status: "active";
      transport: "playing" | "paused";
      releaseId: string;
      activeTrackIndex: number;
    };
```

Invalid pairings (e.g. playing without a release) are rejected in `validatePlaybackSessionState`.

## Code snapshot: public share shell

```tsx
// PublicSharePlaybackShell — logged-out share pages mount playback once
export const PublicSharePlaybackShell = ({ children }: Props) => {
  const hasOuterProvider = useHasReleasePlaybackProvider();
  if (hasOuterProvider) {
    return <>{children}</>;
  }
  return (
    <PlaybackProvidersShell>
      {children}
    </PlaybackProvidersShell>
  );
};
```

Signed-in users on the same URL typically already have the gate-mounted provider—the shell becomes a passthrough.

## Related reading

- [playback-manual-queue.md](../playback-manual-queue.md)
- [patterns.md → Public share vs authenticated app](../patterns.md#public-share-vs-authenticated-app)
- [components.md → GlobalPlaybackDock](../components.md)