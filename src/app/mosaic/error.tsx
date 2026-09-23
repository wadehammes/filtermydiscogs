"use client";

import { ErrorFallbackView } from "src/app/ErrorFallbackView";

export default function MosaicError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  retry: () => void;
}) {
  return (
    <ErrorFallbackView
      title="Failed to load mosaic"
      message="We couldn't generate your mosaic. Try again in a moment."
      error={error}
      onRetry={() => retry()}
      logLabel="Mosaic page error:"
      titleVariant="section"
    />
  );
}
