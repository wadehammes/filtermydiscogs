"use client";

import { useContext } from "react";
import { ReleasePlaybackStateContext } from "src/context/releasePlaybackContexts";
import type { ReleasePlaybackState } from "src/types/releasePlaybackContext.types";

export const useReleasePlaybackState = (): ReleasePlaybackState => {
  const context = useContext(ReleasePlaybackStateContext);

  if (!context) {
    throw new Error(
      "useReleasePlaybackState must be used within ReleasePlaybackProvider",
    );
  }

  return context;
};
