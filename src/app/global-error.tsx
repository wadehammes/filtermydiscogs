"use client";

import { useLayoutEffect } from "react";
import { ErrorFallbackView } from "src/app/ErrorFallbackView";
import { applyThemeFromStorage } from "src/utils/applyThemeFromStorage";
import "src/styles/global.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useLayoutEffect(() => {
    applyThemeFromStorage();
  }, []);

  return (
    <html lang="en">
      <body>
        <ErrorFallbackView
          title="Something went wrong"
          message="We hit an unexpected problem. Try again, or reload the page if it keeps happening."
          error={error}
          onRetry={reset}
          logLabel="Global error:"
        />
      </body>
    </html>
  );
}
