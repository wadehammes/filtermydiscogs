import "server-only";

import { logSanitizedApiRouteFailure } from "src/lib/api-helpers";
import { sendWelcomeSignupEmailIfEligible } from "src/lib/welcomeSignupEmail.server";

export const queueWelcomeSignupEmailAfterLogin = (
  discogsUserId: number,
  routeLabel: string,
): void => {
  void sendWelcomeSignupEmailIfEligible(discogsUserId).catch((error) => {
    logSanitizedApiRouteFailure(
      routeLabel,
      error,
      "Welcome signup email failed:",
    );
  });
};
