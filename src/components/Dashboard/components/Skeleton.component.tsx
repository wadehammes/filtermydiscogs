import styles from "./Skeleton.module.css";

const HORIZONTAL_BAR_WIDTHS = [92, 78, 65, 54, 48, 40, 34, 28];

export function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={`${styles.skeletonText} ${styles.skeletonTextSm}`} />
      <div className={`${styles.skeletonText} ${styles.skeletonTextMd}`} />
      <div className={`${styles.skeletonText} ${styles.skeletonTextLg}`} />
    </div>
  );
}

export function SkeletonGrowthChart() {
  return (
    <div className={styles.skeletonChart}>
      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonChartBody} />
    </div>
  );
}

export function SkeletonBarChart() {
  return (
    <div className={styles.skeletonChart}>
      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonChartBody} />
    </div>
  );
}

export function SkeletonHorizontalBarChart() {
  return (
    <div className={styles.skeletonChart}>
      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonHorizontalBars}>
        {HORIZONTAL_BAR_WIDTHS.map((width) => (
          <div className={styles.skeletonHorizontalBarRow} key={width}>
            <div className={styles.skeletonHorizontalBarLabel} />
            <div
              className={styles.skeletonHorizontalBar}
              style={{ width: `${width}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonPieChart() {
  return (
    <div className={styles.skeletonChart}>
      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonPieBody}>
        <div className={styles.skeletonCircle} />
        <div className={styles.skeletonLegend}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div className={styles.skeletonLegendItem} key={index} />
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
        {Array.from({ length: count }).map((_, index) => (
          <div className={styles.skeletonListItem} key={index} />
        ))}
      </div>
    </div>
  );
}
