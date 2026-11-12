"use client";

import { ErrorFallbackView } from "src/app/ErrorFallbackView";

export default function ReleasesError({
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
      title="Failed to load releases"
      message="We couldn't load your collection. Try again in a moment."
      error={error}
      onRetry={handleRetry}
      logLabel="Releases page error:"
      titleVariant="section"
    />
  );
}
