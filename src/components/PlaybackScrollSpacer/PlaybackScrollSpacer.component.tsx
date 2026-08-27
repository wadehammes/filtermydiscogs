"use client";

import { useReleasePlayback } from "src/context/releasePlayback.context";

export const PlaybackScrollSpacer = () => {
  const { isMiniPlayerVisible } = useReleasePlayback();

  if (!isMiniPlayerVisible) {
    return null;
  }

  return <div data-playback-scroll-spacer aria-hidden />;
};
