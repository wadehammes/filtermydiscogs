import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { PLAYBACK_DOCK_BAR_COLLAPSED_STORAGE_KEY } from "src/constants/storageKeys";
import { parsePlaybackDockBarCollapsed } from "src/utils/playbackDockBarCollapsedStorage";

const playbackDockBarCollapsedStorage = createJSONStorage<boolean>(() => ({
  getItem: (key) => {
    if (typeof window === "undefined") {
      return null;
    }
    return localStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.removeItem(key);
  },
}));

export const playbackDockBarCollapsedAtom = atomWithStorage<boolean>(
  PLAYBACK_DOCK_BAR_COLLAPSED_STORAGE_KEY,
  false,
  {
    ...playbackDockBarCollapsedStorage,
    getItem: (key, initialValue) => {
      if (typeof window === "undefined") {
        return initialValue;
      }
      return parsePlaybackDockBarCollapsed(localStorage.getItem(key));
    },
  },
  { getOnInit: true },
);

export const playbackDockMobileInScrollAtom = atom(false);