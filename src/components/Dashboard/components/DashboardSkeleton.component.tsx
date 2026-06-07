"use client";

import statsStyles from "src/components/Dashboard/components/StatsCards.module.css";
import dashboardStyles from "src/components/Dashboard/DashboardClient.module.css";
import skeletonLayout from "./DashboardSkeleton.module.css";
import {
  SkeletonBarChart,
  SkeletonCard,
  SkeletonGrowthChart,
  SkeletonHorizontalBarChart,
  SkeletonList,
  SkeletonPieChart,
} from "./Skeleton.component";

export function DashboardSkeleton() {
  return (
    <div className={dashboardStyles.content}>
      <div className={statsStyles.statsGrid}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className={dashboardStyles.chartsSection}>
        <SkeletonGrowthChart />
      </div>

      <div className={dashboardStyles.chartsSection}>
        <div className={skeletonLayout.distributionLayout}>
          <div className={skeletonLayout.chartsGrid}>
            <SkeletonBarChart />
            <SkeletonBarChart />
          </div>
          <div className={skeletonLayout.chartsGrid}>
            <SkeletonPieChart />
            <SkeletonPieChart />
          </div>
        </div>
      </div>

      <div className={dashboardStyles.chartsSection}>
        <div className={skeletonLayout.chartsGrid}>
          <SkeletonHorizontalBarChart />
          <SkeletonHorizontalBarChart />
        </div>
      </div>

      <div className={dashboardStyles.sideBySideSection}>
        <div className={dashboardStyles.chartsSection}>
          <SkeletonList count={3} />
        </div>
        <div className={dashboardStyles.chartsSection}>
          <SkeletonPieChart />
        </div>
      </div>

      <div className={dashboardStyles.sideBySideSection}>
        <div className={dashboardStyles.chartsSection}>
          <SkeletonList count={5} />
        </div>
        <div className={dashboardStyles.chartsSection}>
          <SkeletonList count={5} />
        </div>
      </div>

      <div className={dashboardStyles.healthSection}>
        <div className={skeletonLayout.healthGrid}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
