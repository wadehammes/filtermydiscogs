import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { DESKTOP_LAYOUT_MEDIA_QUERY } from "src/constants/layoutMediaQueries";

function subscribeToMediaQuery(callback: () => void) {
  const mql = window.matchMedia(DESKTOP_LAYOUT_MEDIA_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getDesktopMatches() {
  return typeof window !== "undefined"
    ? window.matchMedia(DESKTOP_LAYOUT_MEDIA_QUERY).matches
    : false;
}

function getServerSnapshot() {
  return false;
}

export const useCrateDrawer = () => {
  const isDesktop = useSyncExternalStore(
    subscribeToMediaQuery,
    getDesktopMatches,
    getServerSnapshot,
  );
  const [userToggled, setUserToggled] = useState<boolean | null>(null);

  useEffect(() => {
    setUserToggled(null);
  }, [isDesktop]);

  const isDrawerOpen = userToggled ?? isDesktop;

  const toggleDrawer = useCallback(() => {
    setUserToggled((prev) => (prev === null ? !isDesktop : !prev));
  }, [isDesktop]);

  const openDrawer = useCallback(() => {
    setUserToggled(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setUserToggled(false);
  }, []);

  const resetDrawer = useCallback(() => {
    setUserToggled(null);
  }, []);

  return {
    isDrawerOpen,
    isDesktop,
    toggleDrawer,
    openDrawer,
    closeDrawer,
    resetDrawer,
  };
};
