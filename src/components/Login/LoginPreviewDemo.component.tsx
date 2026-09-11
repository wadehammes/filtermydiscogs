"use client";

import { useCallback, useRef } from "react";
import {
  LOGIN_PREVIEW_VIDEO_ASPECT_RATIO,
  LOGIN_PREVIEW_VIDEO_URL,
  LOGIN_PREVIEW_YOUTUBE_PLAYER_CONFIG,
  requestLoginPreviewHd1080,
} from "src/constants/loginPreviewMedia";
import { LOGIN_PREVIEW_ALT } from "src/constants/siteMetadata";
import FMDIcon from "src/styles/icons/fmd-icon.svg";
import { createClientLazyComponent } from "src/utils/createClientLazyComponent";
import styles from "./LoginPreviewDemo.module.css";

const ReactPlayer = createClientLazyComponent(() =>
  import("react-player").then((module) => module.default),
);

export const LoginPreviewDemo = () => {
  const previewPlayerRef = useRef<HTMLVideoElement>(null);

  const requestHd1080 = useCallback(() => {
    requestLoginPreviewHd1080(previewPlayerRef.current);
  }, []);

  const setPreviewPlayerRef = useCallback(
    (node: HTMLVideoElement | null) => {
      const previousNode = previewPlayerRef.current;

      if (
        previousNode &&
        typeof previousNode.removeEventListener === "function"
      ) {
        previousNode.removeEventListener("loadcomplete", requestHd1080);
      }

      previewPlayerRef.current = node;

      if (node && typeof node.addEventListener === "function") {
        node.addEventListener("loadcomplete", requestHd1080);
      }
    },
    [requestHd1080],
  );

  return (
    <div className={styles.demo} data-testid="fmdLoginPreviewDemo">
      <div className={styles.frame}>
        <div className={styles.titleBar} aria-hidden="true">
          <span className={styles.trafficLight} />
          <span className={styles.trafficLight} />
          <span className={styles.trafficLight} />
        </div>
        <section
          aria-label={LOGIN_PREVIEW_ALT}
          className={styles.viewport}
          style={{ aspectRatio: LOGIN_PREVIEW_VIDEO_ASPECT_RATIO }}
        >
          <ReactPlayer
            ref={setPreviewPlayerRef}
            className={styles.previewPlayer}
            config={{
              youtube: LOGIN_PREVIEW_YOUTUBE_PLAYER_CONFIG,
            }}
            controls
            height="100%"
            loop
            muted
            onPlay={requestHd1080}
            playsInline
            playing
            src={LOGIN_PREVIEW_VIDEO_URL}
            width="100%"
          />
          <div aria-hidden="true" className={styles.brandMark}>
            <FMDIcon className={styles.brandIcon} />
          </div>
        </section>
      </div>
    </div>
  );
};
