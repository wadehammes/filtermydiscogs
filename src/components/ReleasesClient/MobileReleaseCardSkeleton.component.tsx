import styles from "./MobileReleaseCardSkeleton.module.css";

export function MobileReleaseCardSkeleton() {
  return (
    <div
      className={styles.card}
      data-testid="fmdMobileReleaseCardSkeleton"
      aria-hidden
    >
      <div className={styles.cover} />
      <div className={styles.content}>
        <div className={styles.mainContent}>
          <div className={styles.lineCatalog} />
          <div className={styles.lineArtist} />
          <div className={styles.lineTitle} />
          <div className={styles.lineMeta} />
          <div className={styles.notesBlock} />
        </div>
        <div className={styles.pillsRow}>
          <div className={styles.pill} />
          <div className={styles.pill} />
          <div className={styles.pillWide} />
        </div>
      </div>
      <div className={styles.actions}>
        <div className={styles.actionButton} />
        <div className={styles.actionButton} />
      </div>
    </div>
  );
}
