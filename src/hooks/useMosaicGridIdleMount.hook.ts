import { useEffect, useRef, useState } from "react";
import { scheduleAfterNextPaint } from "src/utils/scheduleIdleWork";

export const useMosaicGridIdleMount = (ready: boolean): boolean => {
  const [mounted, setMounted] = useState(false);
  const deferredOnceRef = useRef(false);

  useEffect(() => {
    if (!ready) {
      setMounted(false);
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
  }, [ready]);

  return mounted;
};
