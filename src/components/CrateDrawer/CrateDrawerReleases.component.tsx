import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { definedProps } from "src/utils/definedProps";
import { useCrateDrawerContext } from "./CrateDrawer.context";
import styles from "./CrateDrawer.module.css";
import { CrateDrawerReleaseItem } from "./CrateDrawerReleaseItem.component";

export const CrateDrawerReleases = () => {
  const {
    currentView,
    isLoadingReleases,
    onReleaseClick,
    removeFromCrate,
    selectedReleases,
  } = useCrateDrawerContext();

  if (isLoadingReleases) {
    return (
      <div className={styles.emptyState}>
        <PageLoader message="Loading crate..." />
      </div>
    );
  }

  if (selectedReleases.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3>No releases added to your crate yet.</h3>
        <p>
          {currentView === "list"
            ? "Toggle the checkbox on any release to add it to this crate"
            : 'Click the "+ Add to Crate" button on any release to add it to this crate'}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.releasesList}>
      {selectedReleases.map((release) => (
        <CrateDrawerReleaseItem
          key={release.instance_id}
          release={release}
          onRemove={removeFromCrate}
          {...definedProps({ onReleaseClick })}
        />
      ))}
    </div>
  );
};
