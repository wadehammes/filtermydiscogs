import Spinner from "src/components/Spinner/Spinner.component";
import { ViewToggle } from "src/components/ViewToggle/ViewToggle.component";
import Check from "src/styles/icons/check-solid.svg";
import styles from "./ReleasesHeader.module.css";

interface ReleasesHeaderProps {
  releaseCount: number;
  isFetchingNextPage: boolean;
  showAllLoadedMessage: boolean;
  isMobile: boolean;
  isRandomMode: boolean;
  currentView: "card" | "list" | "random";
  onViewChange: (view: "card" | "list" | "random") => void;
  onRandomClick: () => void;
  onCratesClick?: () => void;
  isCratesOpen?: boolean;
}

export const ReleasesHeader = ({
  releaseCount,
  isFetchingNextPage,
  showAllLoadedMessage,
  isMobile,
  isRandomMode,
  currentView,
  onViewChange,
  onRandomClick,
  onCratesClick,
  isCratesOpen,
}: ReleasesHeaderProps) => {
  return (
    <div className={styles.releasesHeader}>
      <div className={styles.headerText}>
        Showing {releaseCount} releases
        {isFetchingNextPage && (
          <span className={styles.loadingIcon}>
            <Spinner size="xs" aria-label="Loading more" />
            <span>Loading more...</span>
          </span>
        )}
        {showAllLoadedMessage && (
          <span className={styles.loadingIcon}>
            <Check />
            <span>All releases loaded</span>
          </span>
        )}
      </div>
      {!isMobile && (
        <ViewToggle
          currentView={isRandomMode ? "random" : currentView}
          onViewChange={onViewChange}
          onRandomClick={onRandomClick}
          {...(onCratesClick && { onCratesClick, isCratesOpen })}
        />
      )}
    </div>
  );
};
