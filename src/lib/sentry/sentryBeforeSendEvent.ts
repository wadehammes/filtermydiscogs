import type { ErrorEvent } from "@sentry/core";

const PLAYBACK_SKIP_SOURCE_TAG = "playback.skip_source";

export const normalizeSentryErrorEvent = (
  event: ErrorEvent,
): ErrorEvent | null => {
  const skipSource = event.tags?.[PLAYBACK_SKIP_SOURCE_TAG];
  if (typeof skipSource !== "string") {
    return event;
  }

  const reason =
    typeof event.extra?.reason === "string" ? event.extra.reason : "unknown";

  const { exception: _exception, ...eventWithoutException } = event;

  return {
    ...eventWithoutException,
    fingerprint: ["playback-skip", skipSource, reason],
  };
};
