import { useCallback, useEffect } from "react";
import { useAuth } from "src/context/auth.context";
import { useUpdateUserPreferencesMutation } from "src/hooks/queries/useUserPreferencesQuery";
import type { UserPreferencesPatch } from "src/types/userPreferences.types";
import {
  flushUserPreferencesPersist,
  type PersistPreferencesOptions,
  resetUserPreferencesPersistQueue,
  scheduleUserPreferencesPersist,
} from "src/utils/userPreferencesPersistQueue";

export type { PersistPreferencesOptions };

export const usePersistUserPreferences = () => {
  const { state: authState } = useAuth();
  const { isPending, mutate } = useUpdateUserPreferencesMutation(
    authState.userId,
  );

  useEffect(() => {
    if (!authState.isAuthenticated) {
      resetUserPreferencesPersistQueue();
    }
  }, [authState.isAuthenticated]);

  useEffect(
    () => () => {
      flushUserPreferencesPersist((patch, options) => {
        mutate(patch, options);
      });
    },
    [mutate],
  );

  const persistPreferences = useCallback(
    (patch: UserPreferencesPatch, options?: PersistPreferencesOptions) => {
      if (
        !authState.isAuthenticated ||
        authState.isCheckingAuth ||
        authState.userId == null
      ) {
        return;
      }

      scheduleUserPreferencesPersist(
        patch,
        (queuedPatch, queuedOptions) => {
          mutate(queuedPatch, queuedOptions);
        },
        options,
      );
    },
    [
      authState.isAuthenticated,
      authState.isCheckingAuth,
      authState.userId,
      mutate,
    ],
  );

  return {
    isPending,
    persistPreferences,
  };
};
