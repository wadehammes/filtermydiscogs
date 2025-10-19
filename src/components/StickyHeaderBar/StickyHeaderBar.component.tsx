import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import AutocompleteSelect from "src/components/AutocompleteSelect/AutocompleteSelect.component";
import Button from "src/components/Button/Button.component";
import FiltersDrawer from "src/components/FiltersDrawer/FiltersDrawer.component";
import Select from "src/components/Select/Select.component";
import { SORTING_OPTIONS } from "src/constants/sorting";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import { useCrate } from "src/context/crate.context";
import { useFilterHandlers } from "src/hooks/useFilterHandlers.hook";
import styles from "./StickyHeaderBar.module.css";

interface StickyHeaderBarProps {
  allReleasesLoaded?: boolean;
  hideFilters?: boolean;
  hideCrate?: boolean;
}

export const StickyHeaderBar = ({
  allReleasesLoaded = true,
  hideFilters = false,
  hideCrate = false,
}: StickyHeaderBarProps) => {
  const { state: collectionState } = useCollectionContext();
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false);
  const router = useRouter();

  const { logout, state: authState } = useAuth();
  const { username } = authState;
  const { selectedReleases, openDrawer } = useCrate();
  const {
    handleStyleChange,
    handleYearChange,
    handleSortChange,
    styleOptions,
    yearOptions,
    selectedStyles,
    selectedYears,
    selectedSort,
  } = useFilterHandlers("home");

  const { fetchingCollection, collection, error } = collectionState;
  const handleLogout = async () => {
    await logout();
    trackEvent("logout", {
      action: "userLoggedOut",
      category: "auth",
      label: "User Logged Out",
      value: username || "unknown",
    });
  };

  const handleCrateClick = () => {
    openDrawer();
    trackEvent("crateOpened", {
      action: "crateOpenedFromHeader",
      category: "crate",
      label: "Crate Opened from Header",
      value: selectedReleases.length.toString(),
    });
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

  const handleMosaicClick = () => {
    trackEvent("mosaicNavigation", {
      action: "mosaicNavigation",
      category: "navigation",
      label: "Navigate to Mosaic",
      value: "header",
    });
    router.push("/mosaic");
  };

  const sortOptions = useMemo(
    () =>
      SORTING_OPTIONS.map((sort) => ({
        value: sort.value,
        label: sort.name,
      })),
    [],
  );

  return (
    <>
      <div className="layout-sticky-header">
        <div className={styles.headerContent}>
          <h1 className={`typography-h1 ${styles.title || ""}`}>
            <span>Filter My Disco.gs</span>
          </h1>

          {!hideFilters &&
            styleOptions.length > 0 &&
            !fetchingCollection &&
            !error &&
            allReleasesLoaded && (
              <div className={styles.filtersContainer}>
                <AutocompleteSelect
                  label="Style"
                  options={styleOptions}
                  value={selectedStyles}
                  onChange={handleStyleChange}
                  disabled={!collection}
                  multiple={true}
                  placeholder="Select styles..."
                />
                <AutocompleteSelect
                  label="Year"
                  options={yearOptions}
                  value={selectedYears.map((year) => year.toString())}
                  onChange={handleYearChange}
                  disabled={!collection}
                  multiple={true}
                  placeholder="All years"
                />
                <Select
                  label="Sort by"
                  options={sortOptions}
                  value={selectedSort}
                  onChange={handleSortChange}
                  disabled={fetchingCollection}
                  placeholder="Select sort option..."
                />
              </div>
            )}

          {!hideCrate &&
            selectedReleases.length > 0 &&
            !fetchingCollection &&
            collection &&
            allReleasesLoaded && (
              <Button
                className={styles.desktopCrateButton || ""}
                variant="primary"
                size="md"
                onPress={handleCrateClick}
                aria-label={`Open crate with ${selectedReleases.length} items`}
              >
                <span>My Crate</span>
                <span className={styles.crateCount}>
                  {selectedReleases.length}
                </span>
              </Button>
            )}

          {/* Mobile actions - horizontal layout */}
          <div className={styles.mobileActions}>
            {!hideFilters && allReleasesLoaded && (
              <Button
                variant="secondary"
                size="sm"
                onPress={handleFiltersClick}
                aria-label="Open filters"
              >
                <span>⚙️</span>
                <span>Filters</span>
              </Button>
            )}

            {allReleasesLoaded && (
              <Button
                variant="secondary"
                size="sm"
                onPress={handleMosaicClick}
                aria-label="View mosaic"
              >
                <span>🖼️</span>
                <span>Mosaic</span>
              </Button>
            )}

            {selectedReleases.length > 0 &&
              !fetchingCollection &&
              collection &&
              allReleasesLoaded && (
                <Button
                  variant="primary"
                  size="sm"
                  onPress={handleCrateClick}
                  aria-label={`Open crate with ${selectedReleases.length} items`}
                >
                  <span>My Crate</span>
                  <span className={styles.crateCount}>
                    {selectedReleases.length}
                  </span>
                </Button>
              )}

            <Button variant="danger" size="sm" onPress={handleLogout}>
              Logout
            </Button>
          </div>

          {/* Desktop user section - hidden on mobile */}
          <div className={styles.userSection}>
            {allReleasesLoaded && (
              <Button
                variant="secondary"
                size="md"
                onPress={handleMosaicClick}
                aria-label="View mosaic"
              >
                <span>🖼️</span>
                <span>Mosaic</span>
              </Button>
            )}
            {username && (
              <span className={styles.username}>Welcome, {username}</span>
            )}
            <Button variant="danger" size="md" onPress={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile filters drawer */}
      <FiltersDrawer
        isOpen={isFiltersDrawerOpen}
        onClose={closeFiltersDrawer}
      />
    </>
  );
};

export default StickyHeaderBar;
