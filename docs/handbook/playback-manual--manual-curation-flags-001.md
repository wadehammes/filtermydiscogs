## Manual curation flags

| Ref / helper                     | Set when                                                                                              | Effect                                                                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **`queueManuallyExtendedRef`**   | **`addToQueue`**, **`addPreviewToQueue`**, **`reorderQueue`**, restore with non-empty persisted queue | **`shouldApplyPendingAlbumQueueRebuild`** returns false — deferred **`RESOLVE_PENDING_TRACK`** must not replace curated upcoming |
| **`shouldRebuildAlbumQueueRef`** | Cleared on manual **`addToQueue`** / **`reorderQueue`**; album **`startPlayback`** when appropriate   | Album-tail rebuild runs only when this stays true **and** manual flag is false                                                   |

