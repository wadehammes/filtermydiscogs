import "server-only";

import { logSanitizedApiRouteFailure } from "src/lib/api-helpers";

export const runContactRouteSideEffect = (
  promise: Promise<void>,
  logMessage: string,
  routeLabel = "/api/user/contact",
): void => {
  void promise.catch((error) =>
    logSanitizedApiRouteFailure(routeLabel, error, logMessage),
  );
};
