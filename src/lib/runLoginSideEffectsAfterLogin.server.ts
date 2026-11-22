import "server-only";

import { logSanitizedApiRouteFailure } from "src/lib/api-helpers";
import { backfillUserEmailFromDiscogsProfileIfEmpty } from "src/lib/backfillUserEmailFromDiscogsProfile.server";
import type { DiscogsProfileEmailCredentials } from "src/lib/discogs-profile-email.server";
import { sendWelcomeSignupEmailIfEligible } from "src/lib/welcomeSignupEmail.server";

export const runLoginSideEffectsAfterLogin = async (
  discogsUserId: number,
  routeLabel: string,
  oauthCredentials: DiscogsProfileEmailCredentials,
): Promise<void> => {
  await backfillUserEmailFromDiscogsProfileIfEmpty(
    discogsUserId,
    oauthCredentials,
    routeLabel,
  );

  await sendWelcomeSignupEmailIfEligible(discogsUserId);
};

export const runLoginSideEffectsAfterLoginWithLoggedFailure = async (
  discogsUserId: number,
  routeLabel: string,
  oauthCredentials: DiscogsProfileEmailCredentials,
  failureLogPrefix: string,
): Promise<void> => {
  try {
    await runLoginSideEffectsAfterLogin(
      discogsUserId,
      routeLabel,
      oauthCredentials,
    );
  } catch (error) {
    logSanitizedApiRouteFailure(routeLabel, error, failureLogPrefix);
  }
};
