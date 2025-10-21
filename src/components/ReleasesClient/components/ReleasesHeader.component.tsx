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
}: ReleasesHeaderProps) => {
  return (
    <div className={styles.releasesHeader}>
      <p>
        Showing {releaseCount} releases
        {isFetchingNextPage && (
          <span className={styles.loadingIcon}>
            <span className={styles.spinner} />
            <span>Loading more...</span>
          </span>
        )}
        {showAllLoadedMessage && (
          <span className={styles.loadingIcon}>
            <Check />
            <span>All releases loaded</span>
          </span>
        )}
      </p>
      {!isMobile && (
        <ViewToggle
          currentView={isRandomMode ? "random" : currentView}
          onViewChange={onViewChange}
          onRandomClick={onRandomClick}
        />
      )}
    </div>
  );
};
