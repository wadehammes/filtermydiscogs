import { useEffect, useState } from "react";
import Spinner from "src/components/Spinner/Spinner.component";
import { ALL_RELEASES_LOADED } from "src/constants";
import Check from "src/styles/icons/check-solid.svg";
import styles from "./ReleasesLoading.module.css";

interface ReleasesLoadingProps {
  isLoaded: boolean;
  progress?:
    | {
        current: number;
        total?: number;
      }
    | undefined;
}

export const ReleasesLoading = ({
  isLoaded = false,
  progress,
}: ReleasesLoadingProps) => {
  const [hide, setHide] = useState<boolean>(false);

  useEffect(() => {
    if (isLoaded) {
      const timeout = setTimeout(() => {
        setHide(true);
      }, 1000);

      return () => clearTimeout(timeout);
    }
    setHide(false);
    return undefined;
  }, [isLoaded]);

  return !hide ? (
    <div className={styles.loadingContainer}>
      {isLoaded ? (
        <span>
          <Check /> {ALL_RELEASES_LOADED}
        </span>
      ) : (
        <>
          <Spinner
            size="xl"
            className={styles.spinner}
            aria-label="Loading your collection"
          />
          <div className={styles.loadingText}>
            Loading your collection...
            {progress && (
              <div className={styles.progressText}>
                {progress.total
                  ? `${progress.current} of ${progress.total} releases loaded`
                  : `${progress.current} releases loaded`}
                {progress.current > 1000 && (
                  <div className={styles.largeCollectionNote}>
                    Large collections may take a while to load completely
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  ) : null;
};

export default ReleasesLoading;
