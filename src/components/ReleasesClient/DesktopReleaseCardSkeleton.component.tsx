import classNames from "classnames";
import skeletonPulseStyles from "src/styles/modules/skeleton-pulse.module.css";
import styles from "./DesktopReleaseCardSkeleton.module.css";

const pulseSurface = skeletonPulseStyles.pulsesurface;

export function DesktopReleaseCardSkeleton() {
  return (
    <div
      className={styles.card}
      data-testid="fmdDesktopReleaseCardSkeleton"
      aria-hidden
    >
      <div className={classNames(styles.cover, pulseSurface)} />
      <div className={styles.content}>
        <div className={styles.mainContent}>
          <div className={classNames(styles.lineCatalog, pulseSurface)} />
          <div className={styles.textStack}>
            <div className={classNames(styles.lineArtist, pulseSurface)} />
            <div className={classNames(styles.lineTitle, pulseSurface)} />
            <div className={classNames(styles.lineMeta, pulseSurface)} />
          </div>
        </div>
        <div className={styles.pillsRow}>
          <div className={classNames(styles.pill, pulseSurface)} />
          <div className={classNames(styles.pill, pulseSurface)} />
          <div className={classNames(styles.pillWide, pulseSurface)} />
        </div>
      </div>
    </div>
  );
}
