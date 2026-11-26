## Embed guard (same committed upload)

| Scenario                                                                            | Expected behavior                                          | Spec                                                                                       |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Repeat load-started while embed **confirmed** and **same committed `embedVideoId`** | Ignore load-started (no confirm reset, no watchdog re-arm) | **`playbackSimilarQueueEmbedGuard.spec.ts`** (**`shouldIgnoreConfirmedEmbedLoadStarted`**) |
| Provider wiring                                                                     | Passes **`committedEmbedVideoId`** into guard              | **`useReleasePlaybackProvider.hook.ts`** + context / hook specs above                      |

