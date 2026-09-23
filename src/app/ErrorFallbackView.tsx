"use client";

import { useEffect } from "react";
import styles from "src/styles/modules/error-boundary.module.css";
import { isLocalDevHost } from "src/utils/isLocalDevHost";

export interface ErrorFallbackViewProps {
  title: string;
  message: string;
  error: Error & { digest?: string };
  onRetry: () => void;
  logLabel: string;
  titleVariant?: "page" | "section";
}

export const ErrorFallbackView = ({
  title,
  message,
  error,
  onRetry,
  logLabel,
  titleVariant = "page",
}: ErrorFallbackViewProps) => {
  const showErrorDetails = isLocalDevHost();
  const TitleTag = titleVariant === "page" ? "h1" : "h2";

  useEffect(() => {
    if (showErrorDetails) {
      console.error(logLabel, error);
    }
  }, [error, logLabel, showErrorDetails]);

  return (
    <div className={styles.shell}>
      <div className={styles.inner}>
        <div className={styles.card} role="alert">
          <TitleTag
            className={
              titleVariant === "page" ? styles.titlePage : styles.titleSection
            }
          >
            {title}
          </TitleTag>
          <p className={styles.message}>{message}</p>
          {showErrorDetails ? (
            <details className={styles.details}>
              <summary className={styles.detailsSummary}>
                Error details (development only)
              </summary>
              <pre className={styles.detailsContent}>
                {error.message}
                {error.digest ? `\n\nDigest: ${error.digest}` : ""}
              </pre>
            </details>
          ) : null}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.retryButton}
              onClick={onRetry}
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
