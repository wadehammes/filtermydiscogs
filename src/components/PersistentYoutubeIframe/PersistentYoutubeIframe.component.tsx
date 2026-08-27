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
  playbackKey,
  autoplay = false,
  variant = "hidden",
}: PersistentYoutubeIframeProps) => {
  const {
    registerPlaybackIframe,
    notifyPlaybackIframeLoaded,
    resumePlaybackFromGesture,
  } = useReleasePlaybackIframeActions();

  const [initialVideoId] = useState(videoId);
  const loadedVideoIdRef = useRef(initialVideoId);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const embedUrl = useMemo(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : undefined;

    return buildYoutubeEmbedUrl({
      videoId: initialVideoId,
      autoplay,
      ...definedProps({ origin }),
    });
  }, [autoplay, initialVideoId]);

  const setIframeRef = useCallback(
    (node: HTMLIFrameElement | null) => {
      iframeRef.current = node;
      registerPlaybackIframe(node);
    },
    [registerPlaybackIframe],
  );

  useEffect(() => {
    if (videoId === loadedVideoIdRef.current) {
      return;
    }

    loadedVideoIdRef.current = videoId;

    if (!iframeRef.current) {
      return;
    }

    transitionYoutubeIframeToVideo({
      iframe: iframeRef.current,
      videoId,
    });

    if (autoplay) {
      resumePlaybackFromGesture();
    }
  }, [autoplay, resumePlaybackFromGesture, videoId]);

  useEffect(() => {
    if (variant !== "visible" || !playbackKey) {
      return;
    }

    resumePlaybackFromGesture();
  }, [playbackKey, resumePlaybackFromGesture, variant]);

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
