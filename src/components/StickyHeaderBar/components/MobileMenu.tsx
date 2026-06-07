import { useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import { BottomDrawer } from "src/components/BottomDrawer/BottomDrawer.component";
import { ConfirmDialog } from "src/components/ConfirmDialog/ConfirmDialog.component";
import { FiltersDrawer } from "src/components/FiltersDrawer/FiltersDrawer.component";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import { FiltersActionTypes } from "src/context/filters.context";
import { ViewActionTypes } from "src/context/view.context";
import { useSyncCratesMutation } from "src/hooks/queries/useCrateMutations";
import { useDiscogsCollectionQuery } from "src/hooks/queries/useDiscogsCollectionQuery";
import {
  useFiltersDispatch,
  useIsRandomMode,
} from "src/hooks/useFilterAtoms.hook";
import { useViewDispatch } from "src/hooks/useViewAtoms.hook";
import { prepareCollectionForSync } from "src/utils/syncCollection.helper";
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
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const { logout, state: authState } = useAuth();
  const { username, isAuthenticated } = authState;
  const { state: collectionState } = useCollectionContext();
  const { fetchingCollection, collection, error } = collectionState;
  const syncMutation = useSyncCratesMutation(authState.userId);
  const filtersDispatch = useFiltersDispatch();
  const viewDispatch = useViewDispatch();
  const isRandomMode = useIsRandomMode();
  const {
    data: collectionData,
    hasNextPage,
    isFetchingNextPage,
  } = useDiscogsCollectionQuery({
    username: username || "",
    enabled: isAuthenticated,
  });

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

  const isCollectionLoading = hasNextPage || isFetchingNextPage;
  const isSyncDisabled = syncMutation.isPending || isCollectionLoading;

  const handleSyncClick = () => {
    setIsOpen(false);
    setShowSyncDialog(true);
  };

  const handleSyncConfirm = () => {
    const syncResult = prepareCollectionForSync(
      collectionData,
      hasNextPage,
      isFetchingNextPage,
    );

    if (!syncResult.isValid) {
      alert(syncResult.error);
      setShowSyncDialog(false);
      return;
    }

    if (!syncResult.instanceIds) {
      alert("No instance IDs found.");
      setShowSyncDialog(false);
      return;
    }

    syncMutation.mutate(
      { collectionInstanceIds: syncResult.instanceIds },
      {
        onSuccess: (data) => {
          setShowSyncDialog(false);
          trackEvent("crateSync", {
            action: "crateSyncManual",
            category: "crate",
            label: "Manual Crate Sync",
            value: data.removedCount.toString(),
          });
          if (data.removedCount > 0) {
            alert(
              `Sync complete: Removed ${data.removedCount} release${data.removedCount !== 1 ? "s" : ""} from your crates.`,
            );
          } else {
            alert(
              "Sync complete: All releases in your crates are still in your collection.",
            );
          }
        },
        onError: (error) => {
          alert(
            `Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        },
      },
    );
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
            isSyncDisabled={isSyncDisabled}
            isSyncing={syncMutation.isPending}
            isCollectionLoading={isCollectionLoading}
            onSyncClick={handleSyncClick}
            onLogout={handleLogout}
            onAboutClick={handleAboutClick}
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

      <ConfirmDialog
        isOpen={showSyncDialog}
        title="Sync Collection"
        message="This will sync your crates with your Discogs collection and remove any releases from your crates that are no longer in your collection. This action cannot be undone. Continue?"
        confirmLabel={syncMutation.isPending ? "Syncing..." : "Sync"}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleSyncConfirm}
        onCancel={() => setShowSyncDialog(false)}
        isConfirming={syncMutation.isPending}
      />
    </>
  );
};
