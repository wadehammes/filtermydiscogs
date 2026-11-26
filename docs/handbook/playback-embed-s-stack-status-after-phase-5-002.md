## Stack status (after phase 5)

Phases 0–5 landed the **embed session module**, unified **`tryConfirmPlaybackEmbedFromSignal`**, session-driven loading/confirm refs, spec split, and **`resetEmbedSession`** on stop. **Provider and embed hooks are not fully “thin” yet** — watchdog arming, tab-visible recovery, and skip orchestration still live in [`useReleasePlaybackProvider.hook.ts`](../../src/hooks/useReleasePlaybackProvider.hook.ts) beside session events. Treat further embed work as either **bug fixes at documented choke points** (iframe sync, shared confirm gate) or a **future stack** that moves watchdog/visibility into session transitions and deletes duplicate refs.

**Follow-up stack (example):** `10-19-playback_embed_iframe_loaded_switch` → iframe unchanged-upload + loading defers; `10-19-playback_embed_unified_confirm` → **`shouldAllowAudibleEmbedPlaybackConfirm`** shared by provider + embed hook.

