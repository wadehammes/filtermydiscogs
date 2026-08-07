"use client";

import { createContext, useContext } from "react";

const PlaybackPageScrollContext = createContext<HTMLElement | null>(null);

export const PlaybackPageScrollProvider = PlaybackPageScrollContext.Provider;

export const usePlaybackPageScrollElement = (): HTMLElement | null =>
  useContext(PlaybackPageScrollContext);
