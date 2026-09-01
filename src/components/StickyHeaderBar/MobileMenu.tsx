import { useState } from "react";
import { BottomDrawer } from "src/components/BottomDrawer/BottomDrawer.component";
import { FiltersDrawer } from "src/components/FiltersDrawer/FiltersDrawer.component";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import { FiltersActionTypes } from "src/context/filters.context";
import { ViewActionTypes } from "src/context/view.context";
import {
  useAppliedFilterCount,
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
  showCrates?: boolean;
  showFilters?: boolean;
  isDisabled?: boolean;
}

export const MobileMenu = ({
  currentPage,
  showMosaic = true,
  showReleases = true,
  showDashboard = true,
  showCrates = true,
  showFilters = true,
  isDisabled = false,
}: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false);
  const { logout, state: authState } = useAuth();
  const { state: collectionState } = useCollectionContext();
  const { fetchingCollection, collection, error } = collectionState;
  const filtersDispatch = useFiltersDispatch();
  const viewDispatch = useViewDispatch();
  const isRandomMode = useIsRandomMode();
  const appliedFilterCount = useAppliedFilterCount();

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }

    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  const handleFiltersClick = () => {
    setIsFiltersDrawerOpen(true);
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
  };

  const handleAboutClick = () => {
    setIsOpen(false);
  };

  const handleSupportClick = () => {
    setIsOpen(false);
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
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
        appliedFilterCount={appliedFilterCount}
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
            username={authState.username || null}
            onLogout={handleLogout}
            onAboutClick={handleAboutClick}
            onSupportClick={handleSupportClick}
            onSettingsClick={handleSettingsClick}
          />
        }
      >
        <MobileMenuNav
          currentPage={currentPage}
          showMosaic={showMosaic}
          showReleases={showReleases}
          showDashboard={showDashboard}
          showCrates={showCrates}
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
