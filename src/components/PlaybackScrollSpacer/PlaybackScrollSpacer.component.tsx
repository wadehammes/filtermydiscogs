"use client";

import { useReleasePlayback } from "src/context/releasePlayback.context";

export const PlaybackScrollSpacer = () => {
  const { isPlaying } = useReleasePlayback();

  if (!isPlaying) {
    return null;
  }

  return <div data-playback-scroll-spacer aria-hidden />;
};
