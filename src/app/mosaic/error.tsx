"use client";

import { useEffect } from "react";
import { Page } from "src/components/Page/Page.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";

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
      <StickyHeaderBar
        allReleasesLoaded={true}
        hideCrate={true}
        currentPage="mosaic"
      />
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          justifyContent: "center",
          minHeight: "50vh",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h2>Failed to load mosaic</h2>
        <p>We couldn't generate your mosaic. Please try again.</p>
        {process.env.NODE_ENV === "development" && (
          <details style={{ marginTop: "1rem", textAlign: "left" }}>
            <summary>Error details (development only)</summary>
            <pre style={{ marginTop: "0.5rem", overflow: "auto" }}>
              {error.message}
            </pre>
          </details>
        )}
        <button
          onClick={reset}
          style={{
            backgroundColor: "var(--primary-600)",
            border: "none",
            borderRadius: "4px",
            color: "white",
            cursor: "pointer",
            fontSize: "1rem",
            marginTop: "1rem",
            padding: "0.75rem 1.5rem",
          }}
          type="button"
        >
          Retry
        </button>
      </div>
    </Page>
  );
}
