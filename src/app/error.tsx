"use client";

import { useEffect } from "react";
import { Page } from "src/components/Page/Page.component";
import { isLocalDevHost } from "src/utils/isLocalDevHost";
import styles from "./error.module.css";

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
    <Page>
      <div className={styles.container}>
        <h1 className={styles.title}>Something went wrong!</h1>
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
    </Page>
  );
}
