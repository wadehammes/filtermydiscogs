"use client";

import classNames from "classnames";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReleasePlaybackIframeActions } from "src/context/releasePlayback.context";
import { definedProps } from "src/utils/definedProps";
import {
  buildYoutubeEmbedUrl,
  loadAndPlayYoutubeVideo,
  refreshYoutubeEmbedPlayerLayout,
} from "src/utils/releasePlayback";
import styles from "./PersistentYoutubeIframe.module.css";

interface PersistentYoutubeIframeProps {
  videoId: string;
  videoTitle: string;
  autoplay?: boolean;
  deferVideoLoad?: boolean;
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
  autoplay = false,
  deferVideoLoad = false,
  variant = "hidden",
}: PersistentYoutubeIframeProps) => {
  const {
    registerPlaybackIframe,
    notifyPlaybackIframeLoaded,
    notifyPlaybackVideoLoadStarted,
    notifyPlaybackVideoPresentationReady,
  } = useReleasePlaybackIframeActions();

  const registerPlaybackIframeRef = useRef(registerPlaybackIframe);
  registerPlaybackIframeRef.current = registerPlaybackIframe;

  const [bootstrapVideoId] = useState(videoId);
  const loadedVideoIdRef = useRef(bootstrapVideoId);
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

  const syncIframeToVideoId = useCallback(
    (targetVideoId: string) => {
      const iframe = iframeRef.current;

      if (!iframe) {
        return;
      }

      if (targetVideoId === loadedVideoIdRef.current) {
        notifyPlaybackVideoPresentationReady();
        return;
      }

      loadedVideoIdRef.current = targetVideoId;
      loadAndPlayYoutubeVideo({ iframe, videoId: targetVideoId });
      refreshYoutubeEmbedPlayerLayout({ iframe });
      notifyPlaybackVideoLoadStarted();
    },
    [notifyPlaybackVideoLoadStarted, notifyPlaybackVideoPresentationReady],
  );

  const handleIframeLoad = useCallback(() => {
    notifyPlaybackIframeLoaded();
    refreshYoutubeEmbedPlayerLayout({ iframe: iframeRef.current });
  }, [notifyPlaybackIframeLoaded]);

  useEffect(() => {
    if (deferVideoLoad) {
      return;
    }

    syncIframeToVideoId(videoId);
  }, [deferVideoLoad, syncIframeToVideoId, videoId]);

  useEffect(() => {
    const previousVariant = previousVariantRef.current;
    previousVariantRef.current = variant;

    if (previousVariant !== "hidden" || variant !== "visible") {
      return;
    }

    refreshYoutubeEmbedPlayerLayout({ iframe: iframeRef.current });
  }, [variant]);

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
