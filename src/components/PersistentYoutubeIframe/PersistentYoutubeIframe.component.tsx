"use client";

import classNames from "classnames";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReleasePlaybackIframeActions } from "src/context/releasePlayback.context";
import { definedProps } from "src/utils/definedProps";
import {
  buildYoutubeEmbedUrl,
  loadAndPlayYoutubeVideo,
  refreshYoutubeEmbedPlayerLayout,
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

const buildEmbedUrlForVideo = (videoId: string, autoplay: boolean): string => {
  const origin =
    typeof window !== "undefined" ? window.location.origin : undefined;

  return buildYoutubeEmbedUrl({
    videoId,
    autoplay,
    ...definedProps({ origin }),
  });
};

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
  const loadedWhileHiddenRef = useRef(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const previousVariantRef = useRef(variant);

  const embedUrl = useMemo(
    () => buildEmbedUrlForVideo(bootstrapVideoId, autoplay),
    [autoplay, bootstrapVideoId],
  );

  const setIframeRef = useCallback((node: HTMLIFrameElement | null) => {
    iframeRef.current = node;
    registerPlaybackIframeRef.current(node);
  }, []);

  const transitionIframeToVideo = useCallback(
    (targetVideoId: string) => {
      const iframe = iframeRef.current;

      if (!iframe) {
        return;
      }

      loadedVideoIdRef.current = targetVideoId;
      loadedWhileHiddenRef.current = variant === "hidden";

      if (autoplay) {
        loadAndPlayYoutubeVideo({ iframe, videoId: targetVideoId });
      } else {
        transitionYoutubeIframeToVideo({ iframe, videoId: targetVideoId });
      }

      if (variant === "visible") {
        refreshYoutubeEmbedPlayerLayout({ iframe });
      }
    },
    [autoplay, variant],
  );

  const handleIframeLoad = useCallback(() => {
    notifyPlaybackIframeLoaded();

    if (variant === "visible") {
      refreshYoutubeEmbedPlayerLayout({ iframe: iframeRef.current });
    }
  }, [notifyPlaybackIframeLoaded, variant]);

  useEffect(() => {
    if (videoId === loadedVideoIdRef.current) {
      return;
    }

    transitionIframeToVideo(videoId);

    if (autoplay) {
      resumePlaybackFromGesture();
    }
  }, [autoplay, resumePlaybackFromGesture, transitionIframeToVideo, videoId]);

  useEffect(() => {
    const previousVariant = previousVariantRef.current;
    previousVariantRef.current = variant;

    if (previousVariant !== "hidden" || variant !== "visible") {
      return;
    }

    if (loadedVideoIdRef.current !== videoId) {
      transitionIframeToVideo(videoId);
    } else {
      loadedWhileHiddenRef.current = false;
    }

    refreshYoutubeEmbedPlayerLayout({ iframe: iframeRef.current });
    resumePlaybackFromGesture();
  }, [resumePlaybackFromGesture, transitionIframeToVideo, variant, videoId]);

  useEffect(() => {
    if (variant !== "visible") {
      return;
    }

    const handleDocumentVisible = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      refreshYoutubeEmbedPlayerLayout({ iframe: iframeRef.current });
    };

    document.addEventListener("visibilitychange", handleDocumentVisible);

    return () => {
      document.removeEventListener("visibilitychange", handleDocumentVisible);
    };
  }, [variant]);

  return (
    <iframe
      ref={setIframeRef}
      onLoad={handleIframeLoad}
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
