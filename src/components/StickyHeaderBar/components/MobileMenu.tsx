import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import FiltersDrawer from "src/components/FiltersDrawer/FiltersDrawer.component";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import FilterSolid from "src/styles/icons/filter-solid.svg";
import styles from "./MobileMenu.module.css";

interface MobileMenuProps {
  currentPage?: string | undefined;
  showMosaic?: boolean;
  showReleases?: boolean;
  showFilters?: boolean;
}

export const MobileMenu = ({
  currentPage,
  showMosaic = true,
  showReleases = true,
  showFilters = true,
}: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { logout, state: authState } = useAuth();
  const { username } = authState;
  const { state: collectionState } = useCollectionContext();
  const { fetchingCollection, collection, error } = collectionState;

  const handleNavigation = (page: string, label: string) => {
    trackEvent("pageNavigation", {
      action: "pageNavigation",
      category: "navigation",
      label: `Navigate to ${label}`,
      value: page,
    });
    router.push(`/${page}`);
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const hasValidCollection =
    !(fetchingCollection || error) && Boolean(collection);
  const shouldShowFilters = showFilters && hasValidCollection;

  return (
    <>
      <div className={styles.mobileNav}>
        {/* Filters button */}
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

        {/* Hamburger button */}
        <button
          type="button"
          className={styles.hamburger}
          onClick={toggleMenu}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          <span
            className={`${styles.line} ${isOpen ? styles.line1 : ""}`}
          ></span>
          <span
            className={`${styles.line} ${isOpen ? styles.line2 : ""}`}
          ></span>
          <span
            className={`${styles.line} ${isOpen ? styles.line3 : ""}`}
          ></span>
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className={styles.overlay}>
          <div ref={menuRef} className={styles.menu}>
            <div className={styles.menuHeader}>
              <h2>Menu</h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <nav className={styles.menuNav}>
              {showReleases && (
                <button
                  type="button"
                  className={`${styles.menuItem} ${
                    currentPage === "releases" ? styles.active : ""
                  }`}
                  onClick={() => handleNavigation("releases", "Releases")}
                >
                  <span className={styles.menuIcon}>📀</span>
                  <span>Releases</span>
                </button>
              )}

              {showMosaic && (
                <button
                  type="button"
                  className={`${styles.menuItem} ${
                    currentPage === "mosaic" ? styles.active : ""
                  }`}
                  onClick={() => handleNavigation("mosaic", "Mosaic")}
                >
                  <span className={styles.menuIcon}>🖼️</span>
                  <span>Mosaic</span>
                </button>
              )}
            </nav>

            <div className={styles.menuFooter}>
              {username && (
                <div className={styles.userInfo}>
                  <span>Welcome, {username}</span>
                </div>
              )}
              <button
                type="button"
                className={styles.logoutButton}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile filters drawer */}
      <FiltersDrawer
        isOpen={isFiltersDrawerOpen}
        onClose={closeFiltersDrawer}
      />
    </>
  );
};
