"use client";

import Image from "next/image";
import { useMounted } from "src/hooks/useMounted.hook";
import { useTheme } from "src/hooks/useTheme.hook";
import styles from "./LoginPreviewDemo.module.css";

const PREVIEW_ALT =
  "App preview showing the main interface with release cards, filters, and crate functionality";

export const LoginPreviewDemo = () => {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  const activeTheme = mounted ? resolvedTheme : "light";
  const previewImageSrc =
    activeTheme === "dark"
      ? "/images/app-preview--dark.png"
      : "/images/app-preview--light.png";

  return (
    <div className={styles.demo} data-testid="fmdLoginPreviewDemo">
      <div className={styles.frame}>
        <div className={styles.titleBar} aria-hidden="true">
          <span className={styles.trafficLight} />
          <span className={styles.trafficLight} />
          <span className={styles.trafficLight} />
        </div>
        <div className={styles.viewport}>
          <Image
            src={previewImageSrc}
            alt={PREVIEW_ALT}
            className={styles.previewImage}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 72rem"
          />
        </div>
      </div>
    </div>
  );
};
