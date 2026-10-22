"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_FEATURE_FLAGS,
  type FeatureFlagKey,
  type FeatureFlags,
} from "src/types/featureFlags.types";

const FeatureFlagsContext = createContext<FeatureFlags>(DEFAULT_FEATURE_FLAGS);

const FeatureFlagsSyncContext = createContext<
  ((next: FeatureFlags) => void) | null
>(null);

export type FeatureFlagProviderProps = {
  children: React.ReactNode;
  featureFlags: FeatureFlags;
};

export const FeatureFlagProvider = ({
  children,
  featureFlags: initialFeatureFlags,
}: FeatureFlagProviderProps) => {
  const [featureFlags, setFeatureFlags] = useState(initialFeatureFlags);

  const syncFeatureFlags = useCallback((next: FeatureFlags) => {
    setFeatureFlags(next);
  }, []);

  const value = useMemo(() => featureFlags, [featureFlags]);

  return (
    <FeatureFlagsSyncContext.Provider value={syncFeatureFlags}>
      <FeatureFlagsContext.Provider value={value}>
        {children}
      </FeatureFlagsContext.Provider>
    </FeatureFlagsSyncContext.Provider>
  );
};

export type FeatureFlagsClientSyncProps = {
  featureFlags: FeatureFlags;
};

export const FeatureFlagsClientSync = ({
  featureFlags,
}: FeatureFlagsClientSyncProps) => {
  const syncFeatureFlags = useContext(FeatureFlagsSyncContext);
  const playlistsEnabled = featureFlags.playlists;

  useLayoutEffect(() => {
    if (syncFeatureFlags === null) {
      throw new Error(
        "FeatureFlagsClientSync must render within FeatureFlagProvider",
      );
    }

    syncFeatureFlags({ playlists: playlistsEnabled });
  }, [playlistsEnabled, syncFeatureFlags]);

  return null;
};

export const useFeatureFlags = (): FeatureFlags =>
  useContext(FeatureFlagsContext);

export const useFeatureFlag = <K extends FeatureFlagKey>(
  key: K,
): FeatureFlags[K] => useFeatureFlags()[key];
