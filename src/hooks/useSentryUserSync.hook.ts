"use client";

import { useEffect } from "react";
import { useAuth } from "src/context/auth.context";
import { syncSentryUser } from "src/lib/sentry/syncSentryUser.client";

export const useSentryUserSync = (): void => {
  const { state: authState } = useAuth();

  useEffect(() => {
    syncSentryUser({
      userId: authState.isAuthenticated ? authState.userId : null,
      username: authState.isAuthenticated ? authState.username : null,
    });
  }, [authState.isAuthenticated, authState.userId, authState.username]);
};
