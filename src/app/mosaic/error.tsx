"use client";

import { useEffect } from "react";
import { Page } from "src/components/Page/Page.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import styles from "./error.module.css";

/**
 * Error boundary for the mosaic page.
 * Catches errors and displays a user-friendly error message.
 */
export default function MosaicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Mosaic page error:", error);
    }
  }, [error]);

  return (
    <Page>
      <StickyHeaderBar allReleasesLoaded={true} currentPage="mosaic" />
      <div className={styles.container}>
        <h2 className={styles.title}>Failed to load mosaic</h2>
        <p className={styles.message}>
          We couldn't generate your mosaic. Please try again.
        </p>
        {process.env.NODE_ENV === "development" && (
          <details className={styles.details}>
            <summary>Error details (development only)</summary>
            <pre className={styles.detailsContent}>{error.message}</pre>
          </details>
        )}
        <button onClick={reset} className={styles.button} type="button">
          Retry
        </button>
      </div>
    </Page>
  );
}
