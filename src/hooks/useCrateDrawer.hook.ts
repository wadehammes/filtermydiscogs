import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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

export type CollectionSidePanelMode = "crates" | "playlists";

export const useCrateDrawer = () => {
  const isDesktop = useSyncExternalStore(
    subscribeToMediaQuery,
    getDesktopMatches,
    getServerSnapshot,
  );
  const [userToggled, setUserToggled] = useState<boolean | null>(null);
  const [sidePanel, setSidePanel] = useState<CollectionSidePanelMode>("crates");
  const previousIsDesktopRef = useRef(isDesktop);

  useEffect(() => {
    if (previousIsDesktopRef.current === isDesktop) {
      return;
    }

    previousIsDesktopRef.current = isDesktop;
    setUserToggled(null);
  }, [isDesktop]);

  const isDrawerOpen = userToggled ?? isDesktop;

  const toggleDrawer = useCallback(() => {
    setUserToggled((prev) => (prev === null ? !isDesktop : !prev));
  }, [isDesktop]);

  const openDrawer = useCallback(() => {
    setSidePanel("crates");
    setUserToggled(true);
  }, []);

  const openPlaylistsDrawer = useCallback(() => {
    setSidePanel("playlists");
    setUserToggled(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setUserToggled(false);
  }, []);

  const resetDrawer = useCallback(() => {
    setUserToggled(null);
  }, []);

  const applySidePanelDefault = useCallback(
    (panel: CollectionSidePanelMode) => {
      setSidePanel(panel);
      setUserToggled(null);
    },
    [],
  );

  const selectSidePanel = useCallback(
    (panel: CollectionSidePanelMode) => {
      if (sidePanel === panel) {
        setUserToggled((prev) => (prev === null ? !isDesktop : !prev));
        return;
      }

      setSidePanel(panel);
      setUserToggled(true);
    },
    [isDesktop, sidePanel],
  );

  return {
    isDrawerOpen,
    isDesktop,
    sidePanel,
    toggleDrawer,
    openDrawer,
    openPlaylistsDrawer,
    closeDrawer,
    resetDrawer,
    applySidePanelDefault,
    selectSidePanel,
  };
};
