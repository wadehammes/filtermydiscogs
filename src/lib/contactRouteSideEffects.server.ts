import "server-only";

import { logSanitizedApiRouteFailure } from "src/lib/api-helpers";

export const runContactRouteSideEffect = (
  promise: Promise<void>,
  logMessage: string,
): void => {
  void promise.catch((error) =>
    logSanitizedApiRouteFailure("/api/user/contact", error, logMessage),
  );
};
