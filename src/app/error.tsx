"use client";

import { useEffect } from "react";
import { Page } from "src/components/Page/Page.component";
import styles from "./error.module.css";

/**
 * Root error boundary.
 * Catches errors in the root layout and displays a user-friendly error message.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Root error:", error);
    }
  }, [error]);

  return (
    <Page>
      <div className={styles.container}>
        <h1 className={styles.title}>Something went wrong!</h1>
        <p className={styles.message}>
          We encountered an unexpected error. Please try again.
        </p>
        {process.env.NODE_ENV === "development" && (
          <details className={styles.details}>
            <summary>Error details (development only)</summary>
            <pre className={styles.detailsContent}>{error.message}</pre>
          </details>
        )}
        <button onClick={reset} className={styles.button} type="button">
          Try again
        </button>
      </div>
    </Page>
  );
}
