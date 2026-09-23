"use client";

import { ErrorFallbackView } from "src/app/ErrorFallbackView";

export default function ReleasesError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  retry: () => void;
}) {
  return (
    <ErrorFallbackView
      title="Failed to load releases"
      message="We couldn't load your collection. Try again in a moment."
      error={error}
      onRetry={() => retry()}
      logLabel="Releases page error:"
      titleVariant="section"
    />
  );
}
