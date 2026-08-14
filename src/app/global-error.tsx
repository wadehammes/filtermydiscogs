"use client";

import { useEffect } from "react";
import { isLocalDevHost } from "src/utils/isLocalDevHost";
import "src/styles/global.css";
import styles from "./global-error.module.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const showErrorDetails = isLocalDevHost();

  useEffect(() => {
    if (showErrorDetails) {
      console.error("Global error:", error);
    }
  }, [error, showErrorDetails]);

  return (
    <html lang="en">
      <head>
        <script src="/theme-init.js" />
      </head>
      <body className={styles.shell}>
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
          <button type="button" className={styles.retryButton} onClick={reset}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
