"use client";

import { ErrorFallbackView } from "src/app/ErrorFallbackView";

export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  retry: () => void;
}) {
  return (
    <ErrorFallbackView
      title="Something went wrong"
      message="We hit an unexpected problem. Try again, or reload the page if it keeps happening."
      error={error}
      onRetry={() => retry()}
      logLabel="Root error:"
    />
  );
}
