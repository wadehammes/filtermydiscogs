"use client";

import * as Sentry from "@sentry/react";
import { resolveSentryEnabled } from "src/lib/sentry/sentryInitOptions";

export type SyncSentryUserParams = {
  userId: string | null;
  username: string | null;
};

export const syncSentryUser = ({
  userId,
  username,
}: SyncSentryUserParams): void => {
  if (!resolveSentryEnabled()) {
    return;
  }

  if (!(userId && username)) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: String(userId),
    username,
  });
};
