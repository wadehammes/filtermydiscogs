import styles from "./DesktopReleaseCardSkeleton.module.css";

export function DesktopReleaseCardSkeleton() {
  return (
    <div
      className={styles.card}
      data-testid="fmdDesktopReleaseCardSkeleton"
      aria-hidden
    >
      <div className={styles.cover} />
      <div className={styles.content}>
        <div className={styles.mainContent}>
          <div className={styles.lineCatalog} />
          <div className={styles.textStack}>
            <div className={styles.lineArtist} />
            <div className={styles.lineTitle} />
            <div className={styles.lineMeta} />
          </div>
        </div>
        <div className={styles.pillsRow}>
          <div className={styles.pill} />
          <div className={styles.pill} />
          <div className={styles.pillWide} />
        </div>
      </div>
    </div>
  );
}
