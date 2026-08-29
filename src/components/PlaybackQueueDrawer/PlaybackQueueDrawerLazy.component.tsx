"use client";

import { createClientLazyComponent } from "src/utils/createClientLazyComponent";

export const PlaybackQueueDrawerLazy = createClientLazyComponent(() =>
  import(
    "src/components/PlaybackQueueDrawer/PlaybackQueueDrawer.component"
  ).then((mod) => mod.PlaybackQueueDrawer),
);
