"use client";

import { useEffect, useState } from "react";

export const useToastHostReadyAfterMount = (): boolean => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const readyTimer = window.setTimeout(() => {
      setReady(true);
    }, 0);

    return () => {
      window.clearTimeout(readyTimer);
    };
  }, []);

  return ready;
};
