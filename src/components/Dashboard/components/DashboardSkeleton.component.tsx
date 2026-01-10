"use client";

import styles from "../DashboardClient.module.css";
import {
  SkeletonCard,
  SkeletonChart,
  SkeletonList,
  SkeletonPieChart,
} from "./Skeleton.component";

export function DashboardSkeleton() {
  return (
    <div className={styles.content}>
      <div className={styles.statsGrid}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className={styles.chartsSection}>
        <div className={styles.chartsGrid}>
          <SkeletonChart />
          <SkeletonPieChart />
          <SkeletonChart />
        </div>
      </div>

      <div className={styles.chartsSection}>
        <div className={styles.chartsGrid}>
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>

      <div className={styles.chartsSection}>
        <SkeletonChart />
      </div>

      <div className={styles.sideBySideSection}>
        <div className={styles.chartsSection}>
          <SkeletonList count={3} />
        </div>
        <div className={styles.chartsSection}>
          <SkeletonPieChart />
        </div>
      </div>

      <div className={styles.sideBySideSection}>
        <div className={styles.chartsSection}>
          <SkeletonList count={5} />
        </div>
        <div className={styles.chartsSection}>
          <SkeletonList count={5} />
        </div>
      </div>

      <div className={styles.healthSection}>
        <div className={styles.statsGrid}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
