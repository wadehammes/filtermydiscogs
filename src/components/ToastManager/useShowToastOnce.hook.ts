"use client";

import { useEffect, useRef } from "react";

export const useShowToastOnce = (ready: boolean, show: () => void): void => {
  const hasShownRef = useRef(false);
  const showRef = useRef(show);
  showRef.current = show;

  useEffect(() => {
    if (!(ready && !hasShownRef.current)) {
      return;
    }

    hasShownRef.current = true;
    showRef.current();
  }, [ready]);
};
