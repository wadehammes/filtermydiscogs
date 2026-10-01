"use client";

import classNames from "classnames";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import accessibilityStyles from "src/styles/modules/accessibility.module.css";
import { buildYoutubeThumbnailUrl } from "src/utils/userTrack";
import styles from "./TrackYoutubeOverridePreview.module.css";

export type TrackYoutubeOverridePreviewState =
  | "empty"
  | "pending"
  | "ready"
  | "unavailable";

type TrackYoutubeOverridePreviewProps = {
  videoId: string | null;
};

export const TrackYoutubeOverridePreview = ({
  videoId,
}: TrackYoutubeOverridePreviewProps) => {
  const [loadState, setLoadState] = useState<"idle" | "loaded" | "error">(
    "idle",
  );
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const image = imageRef.current;

    if (image?.complete && image.naturalWidth > 0) {
      setLoadState("loaded");
    }
  }, []);

  const previewState: TrackYoutubeOverridePreviewState = !videoId
    ? "empty"
    : loadState === "loaded"
      ? "ready"
      : loadState === "error"
        ? "unavailable"
        : "pending";

  const previewLabel =
    previewState === "ready"
      ? "YouTube video preview"
      : previewState === "unavailable"
        ? "Preview not available for this link"
        : "Video preview placeholder";
  const thumbnailUrl =
    videoId != null ? buildYoutubeThumbnailUrl(videoId) : null;

  return (
    <div
      className={classNames(styles.preview, {
        [styles.previewReady]: previewState === "ready",
      })}
      data-testid="fmdTrackYoutubeOverridePreview"
      data-preview-state={previewState}
    >
      {previewState !== "ready" ? (
        <span className={accessibilityStyles.visuallyHidden}>
          {previewLabel}
        </span>
      ) : null}
      {thumbnailUrl && loadState !== "error" ? (
        <Image
          ref={imageRef}
          alt={loadState === "loaded" ? "YouTube video preview" : ""}
          className={classNames(styles.previewImage, {
            [styles.previewImageVisible]: loadState === "loaded",
          })}
          fill
          sizes="8.5rem"
          src={thumbnailUrl}
          onLoad={() => {
            setLoadState("loaded");
          }}
          onError={() => {
            setLoadState("error");
          }}
        />
      ) : null}
    </div>
  );
};
