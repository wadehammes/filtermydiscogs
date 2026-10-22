"use client";

import { createContext, type ReactNode, useContext } from "react";

type PlaylistDrawerContextValue = {
  activePlaylistId: string | null;
  selectPlaylist: (playlistId: string | null) => void;
  onReleaseClick?: (instanceId: string) => void;
};

const PlaylistDrawerContext = createContext<
  PlaylistDrawerContextValue | undefined
>(undefined);

export interface PlaylistDrawerProviderProps {
  activePlaylistId: string | null;
  selectPlaylist: (playlistId: string | null) => void;
  onReleaseClick?: (instanceId: string) => void;
  children: ReactNode;
}

export const PlaylistDrawerProvider = ({
  activePlaylistId,
  selectPlaylist,
  onReleaseClick,
  children,
}: PlaylistDrawerProviderProps) => {
  const value: PlaylistDrawerContextValue = onReleaseClick
    ? { activePlaylistId, selectPlaylist, onReleaseClick }
    : { activePlaylistId, selectPlaylist };

  return (
    <PlaylistDrawerContext.Provider value={value}>
      {children}
    </PlaylistDrawerContext.Provider>
  );
};

export const usePlaylistDrawerContext = (): PlaylistDrawerContextValue => {
  const context = useContext(PlaylistDrawerContext);
  if (context === undefined) {
    throw new Error(
      "usePlaylistDrawerContext must be used within PlaylistDrawerProvider",
    );
  }
  return context;
};
