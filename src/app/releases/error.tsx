"use client";

import { useEffect } from "react";
import { Page } from "src/components/Page/Page.component";
import { isLocalDevHost } from "src/utils/isLocalDevHost";
import styles from "./error.module.css";

export default function ReleasesError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  retry: () => void;
}) {
  const showErrorDetails = isLocalDevHost();

  useEffect(() => {
    if (showErrorDetails) {
      console.error("Releases page error:", error);
    }
  }, [error, showErrorDetails]);

  return (
    <Page>
      <div className={styles.container}>
        <h2 className={styles.title}>Failed to load releases</h2>
        <p className={styles.message}>
          We couldn't load your collection. Please try again.
        </p>
        {showErrorDetails ? (
          <details className={styles.details}>
            <summary>Error details (development only)</summary>
            <pre className={styles.detailsContent}>{error.message}</pre>
          </details>
        ) : null}
        <button
          type="button"
          className={styles.retryButton}
          onClick={() => retry()}
        >
          Retry
        </button>
      </div>
    </Page>
  );
}
