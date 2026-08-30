import { useCollectionContext } from "src/context/collection.context";
import { FiltersBar } from "./FiltersBar";
import { FiltersBarSkeleton } from "./FiltersBarSkeleton.component";
import { HeaderTitle } from "./HeaderTitle";
import { MobileMenu } from "./MobileMenu";
import { PageNavigation } from "./PageNavigation";
import styles from "./StickyHeaderBar.module.css";
import { UserActions } from "./UserActions";

interface StickyHeaderBarProps {
  allReleasesLoaded?: boolean;
  hideFilters?: boolean;
  currentPage?: string;
}

export const StickyHeaderBar = ({
  allReleasesLoaded = true,
  hideFilters = false,
  currentPage,
}: StickyHeaderBarProps) => {
  const { state: collectionState } = useCollectionContext();
  const { fetchingCollection, collection, error } = collectionState;

  const isCollectionReady = !(fetchingCollection || error);
  const hasCollection = Boolean(collection);
  const hasValidCollection = isCollectionReady && hasCollection;
  const shouldShowFilters =
    !hideFilters && hasValidCollection && allReleasesLoaded;
  const shouldShowFiltersSkeleton = !(hideFilters || allReleasesLoaded);

  return (
    <>
      <div className="layout-sticky-header">
        <div className={styles.headerContent}>
          <HeaderTitle />

          <div className={styles.desktopNav}>
            <PageNavigation
              currentPage={currentPage}
              showMosaic={true}
              showReleases={true}
              showDashboard={true}
              showCrates={true}
            />
          </div>

          <div className={styles.mobileMenu}>
            <MobileMenu
              currentPage={currentPage}
              showMosaic={true}
              showReleases={true}
              showDashboard={true}
              showCrates={true}
              showFilters={!hideFilters}
            />
          </div>

          <UserActions
            variant="desktop"
            showMosaic={false}
            showUsername={true}
          />
        </div>
      </div>

      {shouldShowFilters ? <FiltersBar disabled={!collection} /> : null}
      {shouldShowFiltersSkeleton ? <FiltersBarSkeleton /> : null}
    </>
  );
};
