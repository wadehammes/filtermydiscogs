import { useEffect, useRef, useState } from "react";
import { scheduleAfterNextPaint } from "src/utils/scheduleIdleWork";

export type UsePaintDeferredMountOptions = {
  immediate?: boolean;
  retainMountedWhenNotReady?: boolean;
};

export const usePaintDeferredMount = (
  ready: boolean,
  options?: UsePaintDeferredMountOptions,
): boolean => {
  const immediate = options?.immediate ?? false;
  const retainMountedWhenNotReady = options?.retainMountedWhenNotReady ?? false;
  const [mounted, setMounted] = useState(false);
  const deferredOnceRef = useRef(false);

  useEffect(() => {
    if (!ready) {
      if (retainMountedWhenNotReady && deferredOnceRef.current) {
        return;
      }
      setMounted(false);
      return;
    }

    if (immediate) {
      deferredOnceRef.current = true;
      setMounted(true);
      return;
    }

    if (!deferredOnceRef.current) {
      deferredOnceRef.current = true;
      let cancelled = false;
      const cancelSchedule = scheduleAfterNextPaint(() => {
        if (!cancelled) {
          setMounted(true);
        }
      });
      return () => {
        cancelled = true;
        cancelSchedule();
      };
    }

    setMounted(true);
    return undefined;
  }, [immediate, ready, retainMountedWhenNotReady]);

  return mounted;
};
