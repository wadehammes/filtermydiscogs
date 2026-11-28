"use client";

import { useAtom } from "jotai";
import { useEffect } from "react";
import { playbackDockMobileInScrollAtom } from "src/atoms/playbackDockUi.atoms";

export const usePlaybackDockMobileInScroll = (enabled: boolean): void => {
  const [, setInScroll] = useAtom(playbackDockMobileInScrollAtom);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    setInScroll(true);

    return () => {
      setInScroll(false);
    };
  }, [enabled, setInScroll]);
};