import { useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import { BottomDrawer } from "src/components/BottomDrawer/BottomDrawer.component";
import { FiltersDrawer } from "src/components/FiltersDrawer/FiltersDrawer.component";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import { FiltersActionTypes } from "src/context/filters.context";
import { ViewActionTypes } from "src/context/view.context";
import {
  useFiltersDispatch,
  useIsRandomMode,
} from "src/hooks/useFilterAtoms.hook";
import { useViewDispatch } from "src/hooks/useViewAtoms.hook";
import { MobileMenuDrawerFooter } from "./MobileMenuDrawerFooter";
import { MobileMenuHeader } from "./MobileMenuHeader";
import { MobileMenuNav } from "./MobileMenuNav";

interface MobileMenuProps {
  currentPage?: string | undefined;
  showMosaic?: boolean;
  showReleases?: boolean;
  showDashboard?: boolean;
  showFilters?: boolean;
  isDisabled?: boolean;
}

export const MobileMenu = ({
  currentPage,
  showMosaic = true,
  showReleases = true,
  showDashboard = true,
  showFilters = true,
  isDisabled = false,
}: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false);
  const { logout, state: authState } = useAuth();
  const { username } = authState;
  const { state: collectionState } = useCollectionContext();
  const { fetchingCollection, collection, error } = collectionState;
  const filtersDispatch = useFiltersDispatch();
  const viewDispatch = useViewDispatch();
  const isRandomMode = useIsRandomMode();

  const handleNavigation = (
    e: React.MouseEvent<HTMLAnchorElement>,
    label: string,
  ) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    trackEvent("pageNavigation", {
      action: "pageNavigation",
      category: "navigation",
      label: `Navigate to ${label}`,
      value: label.toLowerCase(),
    });
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    trackEvent("logout", {
      action: "userLoggedOut",
      category: "auth",
      label: "User Logged Out",
      value: username || "unknown",
    });
    setIsOpen(false);
  };

  const handleFiltersClick = () => {
    setIsFiltersDrawerOpen(true);
    trackEvent("filtersOpened", {
      action: "filtersOpenedFromHeader",
      category: "mobile_filters",
      label: "Filters Opened from Header",
      value: "mobile",
    });
  };

  const handleRandomModeToggle = () => {
    const newIsRandomMode = !isRandomMode;

    if (newIsRandomMode) {
      viewDispatch({
        type: ViewActionTypes.SetView,
        payload: "random",
      });
    }

    filtersDispatch({
      type: FiltersActionTypes.ToggleRandomMode,
      payload: undefined,
    });
    trackEvent("randomModeToggled", {
      action: "toggleRandomMode",
      category: "mobile_filters",
      label: "Random Mode Toggled from Mobile Header",
      value: newIsRandomMode ? "enabled" : "disabled",
    });
  };

  const handleAboutClick = () => {
    setIsOpen(false);
    trackEvent("pageNavigation", {
      action: "pageNavigation",
      category: "navigation",
      label: "Navigate to About",
      value: "about",
    });
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    trackEvent("pageNavigation", {
      action: "pageNavigation",
      category: "navigation",
      label: "Navigate to Settings",
      value: "settings",
    });
  };

  const hasValidCollection =
    !(fetchingCollection || error) && Boolean(collection);
  const shouldShowFilters = showFilters && hasValidCollection;

  return (
    <>
      <MobileMenuHeader
        isOpen={isOpen}
        isRandomMode={isRandomMode}
        shouldShowFilters={shouldShowFilters}
        onToggleMenu={() => setIsOpen(!isOpen)}
        onFiltersClick={handleFiltersClick}
        onRandomModeToggle={handleRandomModeToggle}
      />

      <BottomDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Menu"
        closeButtonAriaLabel="Close menu"
        dataAttribute="data-mobile-menu-open"
        footer={
          <MobileMenuDrawerFooter
            username={username || null}
            onLogout={handleLogout}
            onAboutClick={handleAboutClick}
            onSettingsClick={handleSettingsClick}
          />
        }
      >
        <MobileMenuNav
          currentPage={currentPage}
          showMosaic={showMosaic}
          showReleases={showReleases}
          showDashboard={showDashboard}
          isDisabled={isDisabled}
          onNavigation={handleNavigation}
        />
      </BottomDrawer>

      <FiltersDrawer
        isOpen={isFiltersDrawerOpen}
        onClose={() => setIsFiltersDrawerOpen(false)}
      />
    </>
  );
};
