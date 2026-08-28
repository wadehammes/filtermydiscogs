import classNames from "classnames";
import tracklistStyles from "./ReleaseTracklist.module.css";
import styles from "./ReleaseTracklistSkeleton.module.css";

const SKELETON_ROWS = [
  styles.skeletonTitleWide,
  styles.skeletonTitleMedium,
  styles.skeletonTitleNarrow,
] as const;

export const ReleaseTracklistSkeleton = () => {
  return (
    <div
      className={tracklistStyles.tracklistPanel}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading tracklist"
      data-testid="fmdReleaseTracklistSkeleton"
    >
      <ol className={tracklistStyles.tracklist} aria-hidden>
        {SKELETON_ROWS.map((titleWidthClassName, index) => (
          <li className={styles.skeletonRow} key={index}>
            <div className={styles.skeletonMain}>
              <span className={styles.skeletonPosition} />
              <span
                className={classNames(
                  styles.skeletonTitle,
                  titleWidthClassName,
                )}
              />
            </div>
            <div className={styles.skeletonTrailing}>
              <span className={styles.skeletonDuration} />
              <span className={styles.skeletonQueueWrap}>
                <span className={styles.skeletonQueue} />
              </span>
            </div>
          </li>
        ))}
      </ol>
      <div className={styles.skeletonToolbar} aria-hidden>
        <span className={styles.skeletonToolbarButton} />
      </div>
    </div>
  );
};
