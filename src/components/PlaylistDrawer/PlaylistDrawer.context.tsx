"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
} from "react";

type PlaylistDrawerContextValue = {
  activePlaylistId: string | null;
  selectPlaylist: (playlistId: string | null) => void;
  onReleaseClick?: (instanceId: string) => void;
  statsPanelOpen: boolean;
  setStatsPanelOpen: Dispatch<SetStateAction<boolean>>;
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
  const [statsPanelOpen, setStatsPanelOpen] = useState(false);
  const [statsPanelPlaylistId, setStatsPanelPlaylistId] =
    useState(activePlaylistId);

  if (activePlaylistId !== statsPanelPlaylistId) {
    setStatsPanelPlaylistId(activePlaylistId);
    setStatsPanelOpen(false);
  }

  const value = useMemo((): PlaylistDrawerContextValue => {
    const base = {
      activePlaylistId,
      selectPlaylist,
      statsPanelOpen,
      setStatsPanelOpen,
    };

    return onReleaseClick ? { ...base, onReleaseClick } : base;
  }, [activePlaylistId, onReleaseClick, selectPlaylist, statsPanelOpen]);

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
