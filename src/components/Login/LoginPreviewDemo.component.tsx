"use client";

import {
  LOGIN_PREVIEW_VIDEO_ASPECT_RATIO,
  LOGIN_PREVIEW_VIDEO_URL,
} from "src/constants/loginPreviewMedia";
import { LOGIN_PREVIEW_ALT } from "src/constants/siteMetadata";
import FMDIcon from "src/styles/icons/fmd-icon.svg";
import { createClientLazyComponent } from "src/utils/createClientLazyComponent";
import styles from "./LoginPreviewDemo.module.css";

const ReactPlayer = createClientLazyComponent(() =>
  import("react-player").then((module) => module.default),
);

export const LoginPreviewDemo = () => {
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
            className={styles.previewPlayer}
            config={{
              youtube: {
                cc_load_policy: 0,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
                rel: 0,
              },
            }}
            controls={false}
            height="100%"
            loop
            muted
            playsInline
            playing
            src={LOGIN_PREVIEW_VIDEO_URL}
            width="100%"
          />
          <div aria-hidden="true" className={styles.interactionShield} />
          <div aria-hidden="true" className={styles.brandMark}>
            <FMDIcon className={styles.brandIcon} />
          </div>
        </section>
      </div>
    </div>
  );
};
