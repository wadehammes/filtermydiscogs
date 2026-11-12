"use client";

import { ErrorFallbackView } from "src/app/ErrorFallbackView";

export default function RootError({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  retry: () => void;
}) {
  const handleRetry = retry ?? reset;

  return (
    <ErrorFallbackView
      title="Something went wrong"
      message="We hit an unexpected problem. Try again, or reload the page if it keeps happening."
      error={error}
      onRetry={handleRetry}
      logLabel="Root error:"
    />
  );
}
