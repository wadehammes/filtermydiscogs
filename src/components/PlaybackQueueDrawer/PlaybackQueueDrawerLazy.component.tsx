"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const PlaybackQueueDrawer = dynamic(
  () =>
    import(
      "src/components/PlaybackQueueDrawer/PlaybackQueueDrawer.component"
    ).then((mod) => mod.PlaybackQueueDrawer),
  { ssr: false },
);

type PlaybackQueueDrawerLazyProps = ComponentProps<typeof PlaybackQueueDrawer>;

export const PlaybackQueueDrawerLazy = (
  props: PlaybackQueueDrawerLazyProps,
) => <PlaybackQueueDrawer {...props} />;
