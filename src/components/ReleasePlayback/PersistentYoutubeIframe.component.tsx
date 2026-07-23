"use client";

import classNames from "classnames";
import { useEffect, useMemo } from "react";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import { definedProps } from "src/utils/definedProps";
import { buildYoutubeEmbedUrl } from "src/utils/releasePlayback";
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
  const { registerPlaybackIframe } = useReleasePlayback();

  const embedUrl = useMemo(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : undefined;

    return buildYoutubeEmbedUrl({
      videoId,
      autoplay,
      ...definedProps({ origin }),
    });
  }, [autoplay, videoId]);

  useEffect(() => {
    return () => {
      registerPlaybackIframe(null);
    };
  }, [registerPlaybackIframe]);

  return (
    <iframe
      key={playbackKey}
      ref={registerPlaybackIframe}
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
