"use client";

import type { RefObject } from "react";
import {
  useReleasePlaybackDockEmbedProgress,
  useReleasePlaybackDockTransport,
} from "src/hooks/useReleasePlaybackDockControls.hook";

export const useReleasePlaybackProviderDockEmbed = () =>
  useReleasePlaybackDockEmbedProgress();

export const useReleasePlaybackProviderDockTransport = (input: {
  playbackIframeRef: RefObject<HTMLIFrameElement | null>;
  lastInfoDeliveryCurrentTimeRef: RefObject<number | null | undefined>;
  registerPlaybackIframeBase: (iframe: HTMLIFrameElement | null) => void;
  embedProgress: ReturnType<
    typeof useReleasePlaybackDockEmbedProgress
  >["embedProgress"];
  applyLocalSeekSeconds: (seconds: number) => void;
  isPlaybackReady: boolean;
}) => useReleasePlaybackDockTransport(input);
