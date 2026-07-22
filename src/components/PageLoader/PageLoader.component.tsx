"use client";

import classNames from "classnames";
import { Spinner } from "src/components/Spinner/Spinner.component";
import styles from "./PageLoader.module.css";

interface PageLoaderProps {
  message?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  fullHeight?: boolean;
}

export const PageLoader = ({
  message = "Loading...",
  size = "xl",
  fullHeight = false,
}: PageLoaderProps) => {
  return (
    <div
      className={classNames(styles.container, {
        [styles.fullHeight]: fullHeight,
      })}
      data-testid="fmdPageLoader"
    >
      <Spinner size={size} aria-label={message} />
      <p className={styles.text}>{message}</p>
    </div>
  );
};
