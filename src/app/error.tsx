"use client";

import { useEffect } from "react";
import styles from "src/styles/modules/error-boundary.module.css";
import { isLocalDevHost } from "src/utils/isLocalDevHost";

export default function RootError({
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
      console.error("Root error:", error);
    }
  }, [error, showErrorDetails]);

  return (
    <div className={styles.shell}>
      <div className={styles.container}>
        <h1 className={styles.titleRoot}>Something went wrong!</h1>
        <p className={styles.message}>
          We encountered an unexpected error. Please try again.
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
          Try again
        </button>
      </div>
    </div>
  );
}
