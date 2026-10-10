import "server-only";

import { captureAppError } from "src/lib/sentry/captureAppError.server";
import {
  type CaptureTaggedAppErrorOptions,
  shouldCaptureTaggedAppError,
} from "src/lib/sentry/shouldCaptureTaggedAppError";

export const reportTaggedAppError = (
  tags: Record<string, string>,
  error: unknown,
  options?: CaptureTaggedAppErrorOptions,
) => {
  if (!shouldCaptureTaggedAppError(error, options)) {
    return;
  }

  captureAppError(error, {
    tags,
    ...(options?.extra ? { extra: options.extra } : {}),
  });
};
