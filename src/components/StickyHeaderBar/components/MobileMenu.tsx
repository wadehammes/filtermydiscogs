import classNames from "classnames";
import Link from "next/link";
import { useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import { BottomDrawer } from "src/components/BottomDrawer/BottomDrawer.component";
import { ConfirmDialog } from "src/components/ConfirmDialog/ConfirmDialog.component";
import FiltersDrawer from "src/components/FiltersDrawer/FiltersDrawer.component";
import { ThemeSwitcher } from "src/components/ThemeSwitcher/ThemeSwitcher.component";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import { FiltersActionTypes, useFilters } from "src/context/filters.context";
import { useView, ViewActionTypes } from "src/context/view.context";
import { useSyncCratesMutation } from "src/hooks/queries/useCrateMutations";
import { useDiscogsCollectionQuery } from "src/hooks/queries/useDiscogsCollectionQuery";
import About from "src/styles/icons/about.svg";
import Dashboard from "src/styles/icons/dashboard.svg";
import DiceSolid from "src/styles/icons/dice-solid.svg";
import FilterSolid from "src/styles/icons/filter-solid.svg";
import MenuIcon from "src/styles/icons/menu.svg";
import Mosaic from "src/styles/icons/mosaic.svg";
import VinylRecord from "src/styles/icons/vinyl-record.svg";
import XIcon from "src/styles/icons/x.svg";
import { prepareCollectionForSync } from "src/utils/syncCollection.helper";
import styles from "./MobileMenu.module.css";

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
  const syncMutation = useSyncCratesMutation();
  const {
    data: collectionData,
    hasNextPage,
    isFetchingNextPage,
  } = useDiscogsCollectionQuery(username || "", isAuthenticated);

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

  const toggleMenu = () => {
    setIsOpen(!isOpen);
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

  const closeFiltersDrawer = () => {
    setIsFiltersDrawerOpen(false);
  };

  const { state: filtersState, dispatch: filtersDispatch } = useFilters();
  const { dispatch: viewDispatch } = useView();
  const { isRandomMode } = filtersState;

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

  const hasValidCollection =
    !(fetchingCollection || error) && Boolean(collection);
  const shouldShowFilters = showFilters && hasValidCollection;

  return (
    <>
      <div className={styles.mobileNav}>
        {shouldShowFilters && (
          <>
            <button
              type="button"
              className={`${styles.filtersButton} ${
                isRandomMode ? styles.active : ""
              }`}
              onClick={handleRandomModeToggle}
              aria-label={
                isRandomMode ? "Exit random mode" : "Show a random release"
              }
            >
              <span className={styles.filterIcon}>
                <DiceSolid />
              </span>
            </button>
            <button
              type="button"
              className={styles.filtersButton}
              onClick={handleFiltersClick}
              aria-label="Open filters"
            >
              <span className={styles.filterIcon}>
                <FilterSolid />
              </span>
            </button>
          </>
        )}

        <button
          type="button"
          className={styles.hamburger}
          onClick={toggleMenu}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <XIcon className={styles.menuIcon} />
          ) : (
            <MenuIcon className={styles.menuIcon} />
          )}
        </button>
      </div>

      <BottomDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Menu"
        closeButtonAriaLabel="Close menu"
        dataAttribute="data-mobile-menu-open"
        footer={
          <div className={styles.menuFooter}>
            {username && (
              <div className={styles.userInfo}>
                <span>{username}</span>
              </div>
            )}
            <div className={styles.buttonGroup}>
              <ThemeSwitcher variant="mobile" />
              <button
                type="button"
                className={styles.syncButton}
                onClick={handleSyncClick}
                disabled={isSyncDisabled}
                title={
                  isCollectionLoading
                    ? "Please wait for your collection to finish loading"
                    : undefined
                }
              >
                {syncMutation.isPending
                  ? "Syncing..."
                  : isCollectionLoading
                    ? "Loading..."
                    : "Sync Collection"}
              </button>
              <button
                type="button"
                className={styles.logoutButton}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        }
      >
        <nav className={styles.menuNav}>
          {showDashboard && (
            <Link
              href="/dashboard"
              className={classNames(styles.menuItem, {
                [styles.active as string]: currentPage === "dashboard",
                [styles.disabled as string]: isDisabled,
              })}
              onClick={(e) => handleNavigation(e, "Dashboard")}
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : undefined}
            >
              <span className={styles.menuIcon}>
                <Dashboard />
              </span>
              <span>Dashboard</span>
            </Link>
          )}

          {showReleases && (
            <Link
              href="/releases"
              className={classNames(styles.menuItem, {
                [styles.active as string]: currentPage === "releases",
                [styles.disabled as string]: isDisabled,
              })}
              onClick={(e) => handleNavigation(e, "Releases")}
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : undefined}
            >
              <span className={styles.menuIcon}>
                <VinylRecord />
              </span>
              <span>Releases</span>
            </Link>
          )}

          {showMosaic && (
            <Link
              href="/mosaic"
              className={classNames(styles.menuItem, {
                [styles.active as string]: currentPage === "mosaic",
                [styles.disabled as string]: isDisabled,
              })}
              onClick={(e) => handleNavigation(e, "Mosaic")}
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : undefined}
            >
              <span className={styles.menuIcon}>
                <Mosaic />
              </span>
              <span>Mosaic</span>
            </Link>
          )}

          <Link
            href="/about"
            className={classNames(styles.menuItem, {
              [styles.active as string]: currentPage === "about",
            })}
            onClick={(e) => handleNavigation(e, "About")}
          >
            <span className={styles.menuIcon}>
              <About />
            </span>
            <span>About</span>
          </Link>
        </nav>
      </BottomDrawer>

      <FiltersDrawer
        isOpen={isFiltersDrawerOpen}
        onClose={closeFiltersDrawer}
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
