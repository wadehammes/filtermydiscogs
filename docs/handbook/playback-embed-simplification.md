# Playback embed simplification (stacked work)

Global **queue + session** logic in [`playbackSessionState.ts`](../../src/utils/playbackSessionState.ts) and queue hooks is in good shape. **Embed lifecycle** (confirm, loading UI, watchdog, hidden tab, grace, similar-queue guards) grew as ad hoc refs and effects in [`useReleasePlaybackProvider.hook.ts`](../../src/hooks/useReleasePlaybackProvider.hook.ts) and [`useReleasePlaybackYoutubeEmbed.hook.ts`](../../src/hooks/useReleasePlaybackYoutubeEmbed.hook.ts). This stack replaces that layer with a **pure embed session** module and thinner hooks.

**Contract:** [`playback-embed-invariants.md`](playback-embed-invariants.md) + [`releasePlayback.context.spec.tsx`](../../src/context/releasePlayback.context.spec.tsx) (+ E2E embed specs). No behavior change until a phase explicitly wires production code and keeps the contract green.

## Stack order (bottom → top)

| Layer | Branch (example) | PR focus |
|-------|------------------|----------|
| Trunk | **`staging`** | — |
| Fix in flight | **`10-17-fix_background_queue_advance_regression`** | Hidden-tab poll while transport paused ([PR #1208](https://github.com/wadehammes/filtermydiscogs/pull/1208)) |
| **Phase 0** | **`10-17-playback_embed_phase_0_invariants`** | Invariants doc + handbook routing (no production changes) |
| **Phase 1** | **`10-17-playback_embed_phase_1_session_module`** | Pure [`playbackEmbedSession.ts`](../../src/utils/playbackEmbedSession.ts) + [`playbackEmbedSession.spec.ts`](../../src/utils/playbackEmbedSession.spec.ts) — hidden-tab poll selectors, visible audible-sync poll policy, load/confirm reducer (not wired to hooks yet) |
| **Phase 2** | **`10-17-playback_embed_phase_2_confirm_gate`** | **`tryConfirmPlaybackEmbedFromSignal`** + confirm helpers live in [`playbackEmbedSession.ts`](../../src/utils/playbackEmbedSession.ts); embed hook + provider call the gate (legacy [`releasePlaybackEmbedConfirm.ts`](../../src/utils/releasePlaybackEmbedConfirm.ts) re-exports) |
| **Phase 3** | **`10-17-playback_embed_phase_3_thin_hooks`** | [`applyPlaybackEmbedSessionEvent`](../../src/utils/applyPlaybackEmbedSessionEvent.ts) + [`syncPlaybackEmbedSessionRefs`](../../src/utils/syncPlaybackEmbedSessionRefs.ts) drive legacy refs; provider loading/confirm/imperative-load and embed poll effects use session selectors |
| **Phase 4** | **`10-17-playback_embed_phase_4_dead_paths`** | **`resetEmbedSession`** on **`stopPlayback`**; **`embed/load/started`** on imperative load; confirm reads from session; handbook/patterns updated |
| **Phase 5** (optional) | **`10-17-playback_embed_phase_5_spec_split`** | Split context spec by invariant group (same tests, smaller files) |

Use **`st add <branch>`** from the layer below, then **`st ss --auto --open`** after each phase. Rebase with **`st sync`** before push.

## Phase goals (summary)

- **Phase 0** — Name invariants and spec search strings so refactors have a checklist ([playback-embed-invariants.md](playback-embed-invariants.md)).
- **Phase 1** — Discriminated embed session state + `reduceEmbedSession` / selectors (hidden poll, watchdog arm policy, confirm pending).
- **Phase 2** — One `tryConfirmFromSignal(...)` instead of parallel confirm utils at the iframe boundary.
- **Phase 3** — Provider owns queue/session only; embed hook posts messages → session events.
- **Phase 4** — Delete superseded utils/refs; update [patterns.md → Release playback queue](patterns.md#release-playback-queue) to describe session module as source of truth.
- **Phase 5** — Optional spec file split for navigation only.

## Agents

- Read this chapter + [playback-embed-invariants.md](playback-embed-invariants.md) before embed refactors.
- **TDD:** extend [`playbackEmbedSession.spec.ts`](../../src/utils/playbackEmbedSession.spec.ts) (Phase 1+) before changing hooks.
- Do not add new one-off confirm/watchdog refs in the provider without a matching session transition.
