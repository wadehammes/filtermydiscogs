import { useCollectionContext } from "src/context/collection.context";
import { FiltersBar } from "./components/FiltersBar";
import { HeaderTitle } from "./components/HeaderTitle";
import { MobileMenu } from "./components/MobileMenu";
import { PageNavigation } from "./components/PageNavigation";
import { UserActions } from "./components/UserActions";
import styles from "./StickyHeaderBar.module.css";

interface StickyHeaderBarProps {
  allReleasesLoaded?: boolean;
  hideFilters?: boolean;
  hideCrate?: boolean;
  filterCategory?: string;
  currentPage?: string;
}

export const StickyHeaderBar = ({
  allReleasesLoaded = true,
  hideFilters = false,
  hideCrate = false,
  filterCategory = "home",
  currentPage,
}: StickyHeaderBarProps) => {
  const { state: collectionState } = useCollectionContext();
  const { fetchingCollection, collection, error } = collectionState;

  const isCollectionReady = !(fetchingCollection || error);
  const hasCollection = Boolean(collection);
  const hasValidCollection = isCollectionReady && hasCollection;
  const shouldShowFilters =
    !hideFilters && hasValidCollection && allReleasesLoaded;

  return (
    <>
      <div className="layout-sticky-header">
        <div className={styles.headerContent}>
          <HeaderTitle />

          {/* Desktop navigation */}
          <div className={styles.desktopNav}>
            <PageNavigation
              currentPage={currentPage}
              showMosaic={allReleasesLoaded}
              showReleases={allReleasesLoaded}
            />
          </div>

          {/* Mobile menu */}
          <div className={styles.mobileMenu}>
            <MobileMenu
              currentPage={currentPage}
              showMosaic={allReleasesLoaded}
              showReleases={allReleasesLoaded}
              showFilters={!hideFilters}
            />
          </div>

          {/* Desktop user section */}
          <UserActions
            variant="desktop"
            showMosaic={false}
            showUsername={true}
          />
        </div>
      </div>

      {/* Filters bar */}
      {shouldShowFilters && (
        <FiltersBar
          category={filterCategory}
          disabled={!collection}
          showCrate={!hideCrate}
        />
      )}
    </>
  );
};

export default StickyHeaderBar;
