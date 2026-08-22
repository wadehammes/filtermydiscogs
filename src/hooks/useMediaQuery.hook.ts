import { useSyncExternalStore } from "react";

type MediaQueryStore = {
  subscribe: (callback: () => void) => () => void;
  getSnapshot: () => boolean;
  getServerSnapshot: () => boolean;
};

const mediaQueryStores = new Map<string, MediaQueryStore>();

const createMediaQueryStore = (
  query: string,
  serverSnapshot: boolean,
): MediaQueryStore => ({
  subscribe(callback) {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return () => {};
    }

    const mediaQueryList = window.matchMedia(query);
    mediaQueryList.addEventListener("change", callback);
    return () => mediaQueryList.removeEventListener("change", callback);
  },
  getSnapshot() {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return serverSnapshot;
    }

    return window.matchMedia(query).matches;
  },
  getServerSnapshot: () => serverSnapshot,
});

const getMediaQueryStore = (query: string, serverSnapshot: boolean) => {
  const existing = mediaQueryStores.get(query);
  if (existing) {
    return existing;
  }

  const store = createMediaQueryStore(query, serverSnapshot);
  mediaQueryStores.set(query, store);
  return store;
};

export const useMediaQuery = (query: string, defaultValue = false) => {
  const store = getMediaQueryStore(query, defaultValue);

  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
};
