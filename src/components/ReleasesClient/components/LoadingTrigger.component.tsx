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
    <div ref={infiniteScrollRef} className={styles.loadingTrigger}>
      {isFetchingNextPage && (
        <div className={styles.overlay}>
          <div className={styles.content}>
            <div className={styles.spinner} />
            <p className={styles.message}>Loading more releases...</p>
          </div>
        </div>
      )}
    </div>
  );
};
