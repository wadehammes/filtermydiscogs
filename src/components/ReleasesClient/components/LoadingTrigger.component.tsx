import { ReleasesLoading } from "src/components/ReleasesLoading/ReleasesLoading.component";
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
      {isFetchingNextPage && <ReleasesLoading isLoaded={false} />}
    </div>
  );
};
