"use client";

import classNames from "classnames";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { imperativelySyncPersistentYoutubeIframeToVideoId } from "src/components/PersistentYoutubeIframe/persistentYoutubeIframeVideoSwitch";
import { GTM_YOUTUBE_IFRAME_INSPECTED_ATTR } from "src/constants/analytics";
import { useReleasePlaybackIframeActions } from "src/context/releasePlayback.context";
import {
  loadAndPlayYoutubeVideo,
  refreshYoutubeEmbedPlayerLayout,
} from "src/utils/postYoutubePlayerCommand";
import { buildClientYoutubeEmbedUrl } from "src/utils/releasePlayback";
import { enableYoutubeIframeListening } from "src/utils/youtubeIframeEvents";
import styles from "./PersistentYoutubeIframe.module.css";

interface PersistentYoutubeIframeProps {
  videoId: string;
  videoTitle: string;
  autoplay?: boolean;
  deferVideoLoad?: boolean;
  isPlaybackVideoLoading?: boolean;
  variant?: "hidden" | "visible";
}

export const PERSISTENT_YOUTUBE_IFRAME_ID = "fmdPersistentYoutubeEmbed";

export const PersistentYoutubeIframe = ({
  videoId,
  videoTitle,
  autoplay = false,
  deferVideoLoad = false,
  isPlaybackVideoLoading = false,
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
  const loadedVideoIdRef = useRef<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const previousPlaybackVideoLoadingRef = useRef(isPlaybackVideoLoading);

  const embedUrl = useMemo(
    () =>
      buildClientYoutubeEmbedUrl({ videoId: bootstrapVideoId, autoplay }) ??
      "about:blank",
    [autoplay, bootstrapVideoId],
  );

  const setIframeRef = useCallback((node: HTMLIFrameElement | null) => {
    iframeRef.current = node;
    registerPlaybackIframeRef.current(node);
  }, []);

  const syncIframeToVideoId = useCallback(
    (targetVideoId: string) => {
      loadedVideoIdRef.current =
        imperativelySyncPersistentYoutubeIframeToVideoId({
          iframe: iframeRef.current,
          targetVideoId,
          loadedVideoId: loadedVideoIdRef.current,
          deferPresentationReadyWhenVideoUiLoading: isPlaybackVideoLoading,
          notifyPlaybackVideoLoadStarted,
          notifyPlaybackVideoPresentationReady,
          loadAndPlayYoutubeVideo,
          refreshYoutubeEmbedPlayerLayout,
          enableYoutubeIframeListening,
        });
    },
    [
      isPlaybackVideoLoading,
      notifyPlaybackVideoLoadStarted,
      notifyPlaybackVideoPresentationReady,
    ],
  );

  const handleIframeLoad = useCallback(() => {
    notifyPlaybackIframeLoaded();
    refreshYoutubeEmbedPlayerLayout({ iframe: iframeRef.current });

    if (loadedVideoIdRef.current === null) {
      syncIframeToVideoId(videoId);
    }
  }, [notifyPlaybackIframeLoaded, syncIframeToVideoId, videoId]);

  useEffect(() => {
    if (deferVideoLoad) {
      return;
    }

    syncIframeToVideoId(videoId);
  }, [deferVideoLoad, syncIframeToVideoId, videoId]);

  useEffect(() => {
    if (variant !== "visible") {
      return;
    }

    refreshYoutubeEmbedPlayerLayout({ iframe: iframeRef.current });
  }, [variant]);

  useEffect(() => {
    const wasLoading = previousPlaybackVideoLoadingRef.current;
    previousPlaybackVideoLoadingRef.current = isPlaybackVideoLoading;

    if (variant !== "visible" || !wasLoading || isPlaybackVideoLoading) {
      return;
    }

    refreshYoutubeEmbedPlayerLayout({ iframe: iframeRef.current });
  }, [isPlaybackVideoLoading, variant]);

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
      id={PERSISTENT_YOUTUBE_IFRAME_ID}
      onLoad={handleIframeLoad}
      src={embedUrl}
      title={videoTitle}
      {...{ [GTM_YOUTUBE_IFRAME_INSPECTED_ATTR]: "true" }}
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
