import classNames from "classnames";
import skeletonPulseStyles from "src/styles/modules/skeleton-pulse.module.css";
import tracklistStyles from "./ReleaseTracklist.module.css";
import styles from "./ReleaseTracklistSkeleton.module.css";

const pulseSurface = skeletonPulseStyles.pulsesurface;

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
              <span
                className={classNames(styles.skeletonPosition, pulseSurface)}
              />
              <span
                className={classNames(
                  styles.skeletonTitle,
                  titleWidthClassName,
                  pulseSurface,
                )}
              />
            </div>
            <div className={styles.skeletonTrailing}>
              <span
                className={classNames(styles.skeletonDuration, pulseSurface)}
              />
              <span className={styles.skeletonQueueWrap}>
                <span
                  className={classNames(styles.skeletonQueue, pulseSurface)}
                />
              </span>
            </div>
          </li>
        ))}
      </ol>
      <div className={styles.skeletonToolbar} aria-hidden>
        <span
          className={classNames(styles.skeletonToolbarButton, pulseSurface)}
        />
      </div>
    </div>
  );
};
