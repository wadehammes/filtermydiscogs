import { reportApiRouteFailure } from "src/lib/sentry/reportApiRouteFailure";

export const logApiRouteFailure = (
  route: string,
  error: unknown,
  logMessage?: string,
  context?: {
    status?: number;
    extra?: Record<string, unknown>;
  },
) => {
  if (logMessage) {
    console.error(logMessage, error);
  }

  reportApiRouteFailure(route, error, {
    ...(context?.status !== undefined ? { status: context.status } : {}),
    ...(context?.extra ? { extra: context.extra } : {}),
  });
};
