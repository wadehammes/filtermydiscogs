"use client";

import { useAuth } from "src/context/auth.context";
import { useUserPreferencesQuery } from "src/hooks/queries/useUserPreferencesQuery";
import { DEFAULT_SHOW_DJ_METADATA_ON_TRACKS } from "src/types/userPreferences.types";

export const useShowDjMetadataOnTracks = (): boolean => {
  const { state: authState } = useAuth();
  const { data: preferences } = useUserPreferencesQuery({
    userId: authState.userId,
    enabled: authState.isAuthenticated,
  });

  return (
    preferences?.showDjMetadataOnTracks ?? DEFAULT_SHOW_DJ_METADATA_ON_TRACKS
  );
};
