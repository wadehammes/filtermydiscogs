import { useCallback, useEffect, useRef } from "react";
import { dismissOpenBottomDrawers } from "src/constants/bottomDrawerDismiss";
import { useOptionalCrateActions } from "src/context/crate.context";
import { usePlaybackReleaseClickHandler } from "src/context/playbackReleaseClick.context";

export const usePlaybackReleaseClickWithDismiss = () => {
  const invokeHandler = usePlaybackReleaseClickHandler();
  const crateActions = useOptionalCrateActions();
  const closeDrawerRef = useRef(crateActions?.closeDrawer);

  useEffect(() => {
    closeDrawerRef.current = crateActions?.closeDrawer;
  }, [crateActions?.closeDrawer]);

  return useCallback(
    (instanceId: string) => {
      dismissOpenBottomDrawers();
      closeDrawerRef.current?.();
      invokeHandler(instanceId);
    },
    [invokeHandler],
  );
};
