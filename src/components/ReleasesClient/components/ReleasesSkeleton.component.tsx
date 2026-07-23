import gridStyles from "./ReleasesGrid.module.css";
import styles from "./ReleasesSkeleton.module.css";

const SKELETON_CARD_COUNT = 12;

export function ReleasesSkeleton() {
  return (
    <div className={styles.root} data-testid="fmdReleasesSkeleton">
      <div className={gridStyles.releasesGrid}>
        {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
          <div key={index} className={gridStyles.releaseItem} aria-hidden>
            <div className={styles.card}>
              <div className={styles.cover} />
              <div className={styles.body}>
                <div className={styles.lineSm} />
                <div className={styles.lineMd} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
