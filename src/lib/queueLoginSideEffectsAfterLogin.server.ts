import "server-only";

import { logSanitizedApiRouteFailure } from "src/lib/api-helpers";
import { backfillUserEmailFromDiscogsProfileIfEmpty } from "src/lib/backfillUserEmailFromDiscogsProfile.server";
import type { DiscogsProfileEmailCredentials } from "src/lib/discogs-profile-email.server";
import { sendWelcomeSignupEmailIfEligible } from "src/lib/welcomeSignupEmail.server";

export const queueLoginSideEffectsAfterLogin = (
  discogsUserId: number,
  routeLabel: string,
  oauthCredentials?: DiscogsProfileEmailCredentials,
): void => {
  void (async () => {
    if (oauthCredentials) {
      await backfillUserEmailFromDiscogsProfileIfEmpty(
        discogsUserId,
        oauthCredentials,
        routeLabel,
      );
    }

    await sendWelcomeSignupEmailIfEligible(discogsUserId);
  })().catch((error) => {
    logSanitizedApiRouteFailure(
      routeLabel,
      error,
      "Login side effects failed:",
    );
  });
};
