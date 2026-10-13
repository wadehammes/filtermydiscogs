import "server-only";

import { reportTaggedAppError } from "src/lib/sentry/reportTaggedAppError.server";
import { sentryUserVisibleTag } from "src/lib/sentry/sentryUserVisibleTag";
import { shouldReportHttpFailure } from "src/lib/sentry/shouldReportHttpFailure";

const sentryHttpStatusCapture = (status: number) => ({
  tags: { httpStatus: String(status) },
  extra: { httpStatus: status },
});

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

  const httpStatusCapture =
    context?.status !== undefined
      ? sentryHttpStatusCapture(context.status)
      : undefined;

  reportTaggedAppError(
    {
      "api.route": route,
      ...sentryUserVisibleTag(false),
      ...httpStatusCapture?.tags,
    },
    error,
    {
      extra: {
        ...context?.extra,
        ...httpStatusCapture?.extra,
      },
    },
  );
};
