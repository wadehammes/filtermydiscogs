import { useCallback, useState, useSyncExternalStore } from "react";

function subscribeToMediaQuery(callback: () => void) {
  const mql = window.matchMedia("(min-width: 1024px)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getDesktopMatches() {
  return typeof window !== "undefined"
    ? window.matchMedia("(min-width: 1024px)").matches
    : false;
}

function getServerSnapshot() {
  return false;
}

export function useCrateDrawer() {
  const isDesktop = useSyncExternalStore(
    subscribeToMediaQuery,
    getDesktopMatches,
    getServerSnapshot,
  );
  const [userToggled, setUserToggled] = useState<boolean | null>(null);
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

  return { isDrawerOpen, toggleDrawer, openDrawer, closeDrawer };
}
