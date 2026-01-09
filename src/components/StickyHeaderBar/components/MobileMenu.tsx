import Link from "next/link";
import { useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import { BottomDrawer } from "src/components/BottomDrawer/BottomDrawer.component";
import FiltersDrawer from "src/components/FiltersDrawer/FiltersDrawer.component";
import { ThemeSwitcher } from "src/components/ThemeSwitcher/ThemeSwitcher.component";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import FilterSolid from "src/styles/icons/filter-solid.svg";
import Grid from "src/styles/icons/grid.svg";
import MenuIcon from "src/styles/icons/menu.svg";
import VinylRecord from "src/styles/icons/vinyl-record.svg";
import XIcon from "src/styles/icons/x.svg";
import styles from "./MobileMenu.module.css";

interface MobileMenuProps {
  currentPage?: string | undefined;
  showMosaic?: boolean;
  showReleases?: boolean;
  showFilters?: boolean;
  isDisabled?: boolean;
}

export const MobileMenu = ({
  currentPage,
  showMosaic = true,
  showReleases = true,
  showFilters = true,
  isDisabled = false,
}: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false);
  const { logout, state: authState } = useAuth();
  const { username } = authState;
  const { state: collectionState } = useCollectionContext();
  const { fetchingCollection, collection, error } = collectionState;

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

  const hasValidCollection =
    !(fetchingCollection || error) && Boolean(collection);
  const shouldShowFilters = showFilters && hasValidCollection;

  return (
    <>
      <div className={styles.mobileNav}>
        {shouldShowFilters && (
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
          {showReleases && (
            <Link
              href="/releases"
              className={`${styles.menuItem} ${
                currentPage === "releases" ? styles.active : ""
              } ${isDisabled ? styles.disabled : ""}`}
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
              className={`${styles.menuItem} ${
                currentPage === "mosaic" ? styles.active : ""
              } ${isDisabled ? styles.disabled : ""}`}
              onClick={(e) => handleNavigation(e, "Mosaic")}
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : undefined}
            >
              <span className={styles.menuIcon}>
                <Grid />
              </span>
              <span>Mosaic</span>
            </Link>
          )}

          <Link
            href="/about"
            className={`${styles.menuItem} ${
              currentPage === "about" ? styles.active : ""
            }`}
            onClick={(e) => handleNavigation(e, "About")}
          >
            <span className={styles.menuIcon}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="8"
                  cy="8"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 6V8M8 10H8.01"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span>About</span>
          </Link>
        </nav>
      </BottomDrawer>

      <FiltersDrawer
        isOpen={isFiltersDrawerOpen}
        onClose={closeFiltersDrawer}
      />
    </>
  );
};
