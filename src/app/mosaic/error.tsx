"use client";

import { ErrorFallbackView } from "src/app/ErrorFallbackView";

export default function MosaicError({
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
      title="Failed to load mosaic"
      message="We couldn't generate your mosaic. Try again in a moment."
      error={error}
      onRetry={handleRetry}
      logLabel="Mosaic page error:"
      titleVariant="section"
    />
  );
}
