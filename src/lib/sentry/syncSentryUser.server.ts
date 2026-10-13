import "server-only";

import * as Sentry from "@sentry/nextjs";
import type { VerifiedDiscogsUser } from "src/lib/auth-request";
import { resolveSentryEnabled } from "src/lib/sentry/sentryInitOptions";

export const applySentryUserFromVerifiedDiscogsUser = (
  user: VerifiedDiscogsUser,
): void => {
  if (!resolveSentryEnabled()) {
    return;
  }

  Sentry.getCurrentScope().setUser({
    id: String(user.userId),
    username: user.username,
  });
};
