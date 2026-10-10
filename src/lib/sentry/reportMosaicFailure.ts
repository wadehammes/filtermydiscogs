import { captureAppMessage } from "src/lib/sentry/captureAppMessage.client";
import { normalizeSentryError } from "src/lib/sentry/normalizeSentryError";

export const reportMosaicFailureToSentry = (
  error: unknown,
  extra?: Record<string, unknown>,
) => {
  const normalized = normalizeSentryError(error);

  captureAppMessage(`Mosaic generation failed: ${normalized.message}`, {
    level: "warning",
    fingerprint: ["client-mosaic-failure"],
    tags: {
      "client.domain": "mosaic",
    },
    ...(extra ? { extra } : {}),
  });
};
