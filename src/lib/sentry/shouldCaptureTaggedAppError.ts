import { getErrorHttpStatus } from "src/lib/sentry/getErrorHttpStatus";
import { shouldReportHttpFailure } from "src/lib/sentry/shouldReportHttpFailure";

export type CaptureTaggedAppErrorOptions = {
  extra?: Record<string, unknown>;
  httpStatus?: number;
  gateHttpStatusFromError?: boolean;
};

export const shouldCaptureTaggedAppError = (
  error: unknown,
  options?: CaptureTaggedAppErrorOptions,
): boolean => {
  if (options?.gateHttpStatusFromError) {
    const httpStatus = getErrorHttpStatus(error);
    if (httpStatus !== undefined && !shouldReportHttpFailure(httpStatus)) {
      return false;
    }
  } else if (options?.httpStatus !== undefined) {
    if (!shouldReportHttpFailure(options.httpStatus)) {
      return false;
    }
  }

  return true;
};
