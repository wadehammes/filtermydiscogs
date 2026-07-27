"use client";

import { useEffect } from "react";
import Button from "src/components/Button/Button.component";
import styles from "./error.module.css";

/**
 * Root layout error boundary. Replaces the root layout (no Providers).
 * Must define its own html/body — see Next.js `global-error` docs.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Global error:", error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className={styles.container}>
          <h1 className={styles.title}>Something went wrong!</h1>
          <p className={styles.message}>
            We encountered an unexpected error. Please try again.
          </p>
          {process.env.NODE_ENV === "development" ? (
            <details className={styles.details}>
              <summary>Error details (development only)</summary>
              <pre className={styles.detailsContent}>{error.message}</pre>
            </details>
          ) : null}
          <Button variant="primary" size="md" onClick={reset}>
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
