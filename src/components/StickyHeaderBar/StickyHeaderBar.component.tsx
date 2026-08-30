import { useCollectionContext } from "src/context/collection.context";
import { FiltersBar } from "./FiltersBar";
import { FiltersBarSkeleton } from "./FiltersBarSkeleton.component";
import { HeaderTitle } from "./HeaderTitle";
import { MobileMenu } from "./MobileMenu";
import { PageNavigation } from "./PageNavigation";
import styles from "./StickyHeaderBar.module.css";
import { UserActions } from "./UserActions";

type StickyHeaderBarPart = "all" | "nav" | "filters";

interface StickyHeaderBarProps {
  allReleasesLoaded?: boolean;
  hideFilters?: boolean;
  currentPage?: string;
  part?: StickyHeaderBarPart;
}

export const StickyHeaderBar = ({
  allReleasesLoaded = true,
  hideFilters = false,
  currentPage,
  part = "all",
}: StickyHeaderBarProps) => {
  const { state: collectionState } = useCollectionContext();
  const { fetchingCollection, collection, error } = collectionState;

  const isCollectionReady = !(fetchingCollection || error);
  const hasCollection = Boolean(collection);
  const hasValidCollection = isCollectionReady && hasCollection;
  const shouldShowFilters =
    !hideFilters && hasValidCollection && allReleasesLoaded;
  const shouldShowFiltersSkeleton = !(hideFilters || allReleasesLoaded);

  if (part === "filters") {
    return (
      <>
        {shouldShowFilters ? <FiltersBar disabled={!collection} /> : null}
        {shouldShowFiltersSkeleton ? <FiltersBarSkeleton /> : null}
      </>
    );
  }

  const nav = (
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

        <UserActions variant="desktop" showMosaic={false} showUsername={true} />
      </div>
    </div>
  );

  if (part === "nav") {
    return nav;
  }

  return (
    <>
      {nav}
      {shouldShowFilters ? <FiltersBar disabled={!collection} /> : null}
      {shouldShowFiltersSkeleton ? <FiltersBarSkeleton /> : null}
    </>
  );
};
