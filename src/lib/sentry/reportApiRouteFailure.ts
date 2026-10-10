import "server-only";

import { reportTaggedAppError } from "src/lib/sentry/reportTaggedAppError.server";
import { shouldReportHttpFailure } from "src/lib/sentry/shouldReportHttpFailure";

export const reportApiRouteFailure = (
  route: string,
  error: unknown,
  context?: {
    status?: number;
    extra?: Record<string, unknown>;
  },
) => {
  if (!shouldReportHttpFailure(context?.status)) {
    return;
  }

  reportTaggedAppError(
    {
      "api.route": route,
    },
    error,
    {
      extra: {
        ...context?.extra,
        ...(context?.status !== undefined
          ? { httpStatus: context.status }
          : {}),
      },
    },
  );
};
