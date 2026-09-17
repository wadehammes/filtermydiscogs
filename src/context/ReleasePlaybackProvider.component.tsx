"use client";

import type { ReactNode } from "react";
import {
  ReleasePlaybackActionsContext,
  ReleasePlaybackQueueContext,
  ReleasePlaybackStateContext,
  ReleasePlaybackVisibilityContext,
} from "src/context/releasePlaybackContexts";
import { useReleasePlaybackProvider } from "src/hooks/useReleasePlaybackProvider.hook";

interface ReleasePlaybackProviderProps {
  children: ReactNode;
}

export const ReleasePlaybackProvider = ({
  children,
}: ReleasePlaybackProviderProps) => {
  const { actionsValue, isMiniPlayerVisible, queue, stateValue } =
    useReleasePlaybackProvider();

  return (
    <ReleasePlaybackStateContext.Provider value={stateValue}>
      <ReleasePlaybackActionsContext.Provider value={actionsValue}>
        <ReleasePlaybackQueueContext.Provider value={queue}>
          <ReleasePlaybackVisibilityContext.Provider
            value={isMiniPlayerVisible}
          >
            {children}
          </ReleasePlaybackVisibilityContext.Provider>
        </ReleasePlaybackQueueContext.Provider>
      </ReleasePlaybackActionsContext.Provider>
    </ReleasePlaybackStateContext.Provider>
  );
};
