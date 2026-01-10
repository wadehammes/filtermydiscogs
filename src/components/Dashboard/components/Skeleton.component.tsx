import styles from "./Skeleton.module.css";

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
}

export function Skeleton({ className, height, width }: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${className || ""}`}
      style={{ height, width }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonText} style={{ width: "40%" }} />
      <div
        className={styles.skeletonText}
        style={{ width: "70%", height: "2em" }}
      />
      <div className={styles.skeletonText} style={{ width: "30%" }} />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className={styles.skeletonChart}>
      <div className={styles.skeletonTitle} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
          marginTop: "var(--space-4)",
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={styles.skeletonBar}
            style={{ width: `${60 + i * 5}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonPieChart() {
  return (
    <div className={styles.skeletonChart}>
      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonPie}>
        <div className={styles.skeletonCircle} />
        <div
          style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={styles.skeletonText}
              style={{ width: "60px", height: "16px" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.skeletonChart}>
      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonList}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={styles.skeletonListItem} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className={styles.skeletonGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeletonGridItem} />
      ))}
    </div>
  );
}
