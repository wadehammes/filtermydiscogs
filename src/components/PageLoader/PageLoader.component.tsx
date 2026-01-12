"use client";

import type { FC } from "react";
import Spinner from "src/components/Spinner/Spinner.component";
import styles from "./PageLoader.module.css";

interface PageLoaderProps {
  message?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  fullHeight?: boolean;
}

export const PageLoader: FC<PageLoaderProps> = ({
  message = "Loading...",
  size = "xl",
  fullHeight = false,
}) => {
  return (
    <div
      className={`${styles.container} ${fullHeight ? styles.fullHeight : ""}`}
    >
      <Spinner size={size} aria-label={message} />
      <p className={styles.text}>{message}</p>
    </div>
  );
};

export default PageLoader;
