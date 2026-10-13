import { reportClientFailure } from "src/lib/sentry/reportClientFailure";

export const reportMosaicFailureToSentry = (
  error: unknown,
  extra?: Record<string, unknown>,
) => {
  reportClientFailure("mosaic", error, extra, {
    level: "warning",
    fingerprint: ["client-mosaic-failure"],
  });
};
