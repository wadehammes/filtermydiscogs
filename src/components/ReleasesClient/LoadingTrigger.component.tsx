import classNames from "classnames";
import { Spinner } from "src/components/Spinner/Spinner.component";
import styles from "./LoadingTrigger.module.css";

interface LoadingTriggerProps {
  isFetchingNextPage: boolean;
  infiniteScrollRef: (node?: Element | null) => void;
}

export const LoadingTrigger = ({
  isFetchingNextPage,
  infiniteScrollRef,
}: LoadingTriggerProps) => {
  return (
    <div
      data-testid="fmdReleasesLoadingTrigger"
      ref={infiniteScrollRef}
      className={classNames(styles.loadingTrigger, {
        [styles.loadingTriggerFetching]: isFetchingNextPage,
      })}
    >
      {isFetchingNextPage && (
        <div className={styles.overlay}>
          <div className={styles.content}>
            <Spinner size="md" aria-label="Loading more releases" />
            <p className={styles.message}>Loading more releases...</p>
          </div>
        </div>
      )}
    </div>
  );
};
