"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface PlaybackShellRegistryContextValue {
  isShellActive: boolean;
  registerShell: () => void;
  unregisterShell: () => void;
}

const PlaybackShellRegistryContext =
  createContext<PlaybackShellRegistryContextValue>({
    isShellActive: false,
    registerShell: () => {},
    unregisterShell: () => {},
  });

export const PlaybackShellRegistryProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [activeShellCount, setActiveShellCount] = useState(0);

  const registerShell = useCallback(() => {
    setActiveShellCount((count) => count + 1);
  }, []);

  const unregisterShell = useCallback(() => {
    setActiveShellCount((count) => Math.max(0, count - 1));
  }, []);

  const value = useMemo(
    () => ({
      isShellActive: activeShellCount > 0,
      registerShell,
      unregisterShell,
    }),
    [activeShellCount, registerShell, unregisterShell],
  );

  return (
    <PlaybackShellRegistryContext.Provider value={value}>
      {children}
    </PlaybackShellRegistryContext.Provider>
  );
};

export const usePlaybackShellHandlesDock = (): boolean =>
  useContext(PlaybackShellRegistryContext).isShellActive;

export const usePlaybackShellRegistration = () => {
  const { registerShell, unregisterShell } = useContext(
    PlaybackShellRegistryContext,
  );

  return { registerShell, unregisterShell };
};
