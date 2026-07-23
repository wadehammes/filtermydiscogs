import styles from "./DesktopReleaseCardSkeleton.module.css";

export function DesktopReleaseCardSkeleton() {
  return (
    <div
      className={styles.card}
      data-testid="fmdDesktopReleaseCardSkeleton"
      aria-hidden
    >
      <div className={styles.cover} />
      <div className={styles.body}>
        <div className={styles.lineSm} />
        <div className={styles.lineMd} />
      </div>
    </div>
  );
}
