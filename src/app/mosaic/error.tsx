"use client";

import { useEffect } from "react";
import { Page } from "src/components/Page/Page.component";
import { isLocalDevHost } from "src/utils/isLocalDevHost";
import styles from "./error.module.css";

export default function MosaicError({
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
      console.error("Mosaic page error:", error);
    }
  }, [error, showErrorDetails]);

  return (
    <Page>
      <div className={styles.container}>
        <h2 className={styles.title}>Failed to load mosaic</h2>
        <p className={styles.message}>
          We couldn't generate your mosaic. Please try again.
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
