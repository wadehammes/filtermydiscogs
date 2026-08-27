"use client";

import { useIsMiniPlayerVisible } from "src/context/releasePlayback.context";

export const PlaybackScrollSpacer = () => {
  const isMiniPlayerVisible = useIsMiniPlayerVisible();

  if (!isMiniPlayerVisible) {
    return null;
  }

  return <div data-playback-scroll-spacer aria-hidden />;
};
