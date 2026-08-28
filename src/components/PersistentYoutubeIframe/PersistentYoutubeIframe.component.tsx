"use client";

import classNames from "classnames";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReleasePlaybackIframeActions } from "src/context/releasePlayback.context";
import { definedProps } from "src/utils/definedProps";
import {
  buildYoutubeEmbedUrl,
  transitionYoutubeIframeToVideo,
} from "src/utils/releasePlayback";
import styles from "./PersistentYoutubeIframe.module.css";

interface PersistentYoutubeIframeProps {
  videoId: string;
  videoTitle: string;
  playbackKey: string;
  autoplay?: boolean;
  variant?: "hidden" | "visible";
}

export const PersistentYoutubeIframe = ({
  videoId,
  videoTitle,
  playbackKey: _playbackKey,
  autoplay = false,
  variant = "hidden",
}: PersistentYoutubeIframeProps) => {
  const {
    registerPlaybackIframe,
    notifyPlaybackIframeLoaded,
    resumePlaybackFromGesture,
  } = useReleasePlaybackIframeActions();

  const registerPlaybackIframeRef = useRef(registerPlaybackIframe);
  registerPlaybackIframeRef.current = registerPlaybackIframe;

  const [bootstrapVideoId] = useState(videoId);
  const loadedVideoIdRef = useRef(bootstrapVideoId);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const embedUrl = useMemo(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : undefined;

    return buildYoutubeEmbedUrl({
      videoId: bootstrapVideoId,
      autoplay,
      ...definedProps({ origin }),
    });
  }, [autoplay, bootstrapVideoId]);

  const setIframeRef = useCallback((node: HTMLIFrameElement | null) => {
    iframeRef.current = node;
    registerPlaybackIframeRef.current(node);
  }, []);

  useEffect(() => {
    if (videoId === loadedVideoIdRef.current) {
      return;
    }

    loadedVideoIdRef.current = videoId;
    const iframe = iframeRef.current;

    if (!iframe) {
      return;
    }

    transitionYoutubeIframeToVideo({ iframe, videoId });

    if (autoplay) {
      resumePlaybackFromGesture();
    }
  }, [autoplay, resumePlaybackFromGesture, videoId]);

  useEffect(() => {
    if (variant !== "visible") {
      return;
    }

    resumePlaybackFromGesture();
  }, [resumePlaybackFromGesture, variant]);

  return (
    <iframe
      ref={setIframeRef}
      onLoad={notifyPlaybackIframeLoaded}
      src={embedUrl}
      title={videoTitle}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className={classNames({
        [styles.iframeHidden]: variant === "hidden",
        [styles.iframeVisible]: variant === "visible",
      })}
      data-testid="fmdPersistentYoutubeIframe"
      data-variant={variant}
    />
  );
};
