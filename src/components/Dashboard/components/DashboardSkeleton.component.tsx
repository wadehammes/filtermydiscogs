"use client";

import type { ReactNode } from "react";
import statsStyles from "src/components/Dashboard/components/DashboardHero.module.css";
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

function SkeletonSection({ children }: { children: ReactNode }) {
  return (
    <div className={skeletonLayout.section}>
      <div className={skeletonLayout.sectionHeader}>
        <div className={skeletonLayout.sectionTitle} />
        <div className={skeletonLayout.sectionLede} />
      </div>
      {children}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className={dashboardStyles.content}>
      <div className={statsStyles.hero}>
        <div className={statsStyles.intro}>
          <div className={skeletonLayout.heroEyebrow} />
          <div className={skeletonLayout.heroTitle} />
          <div className={skeletonLayout.heroCountBlock}>
            <div className={skeletonLayout.heroCount} />
            <div className={skeletonLayout.heroLine} />
          </div>
        </div>

        <aside aria-hidden="true" className={statsStyles.metricsPanel}>
          <dl className={statsStyles.metricsList}>
            {[0, 1].map((index) => (
              <div className={statsStyles.metricItem} key={index}>
                <div className={skeletonLayout.metricLabel} />
                <div className={skeletonLayout.metricValue} />
              </div>
            ))}
          </dl>
        </aside>
      </div>

      <SkeletonSection>
        <SkeletonList count={3} />
      </SkeletonSection>

      <SkeletonSection>
        <SkeletonGrowthChart />
      </SkeletonSection>

      <SkeletonSection>
        <div className={skeletonLayout.distributionLayout}>
          <div className={skeletonLayout.chartsGrid}>
            <SkeletonBarChart />
            <SkeletonBarChart />
          </div>
          <div className={skeletonLayout.chartsGridThree}>
            <SkeletonPieChart />
            <SkeletonPieChart />
            <SkeletonPieChart />
          </div>
        </div>
      </SkeletonSection>

      <SkeletonSection>
        <div className={skeletonLayout.chartsGrid}>
          <SkeletonHorizontalBarChart />
          <SkeletonHorizontalBarChart />
        </div>
      </SkeletonSection>

      <SkeletonSection>
        <SkeletonList count={3} />
      </SkeletonSection>

      <div className={dashboardStyles.storyPair}>
        <SkeletonSection>
          <SkeletonList count={5} />
        </SkeletonSection>
        <SkeletonSection>
          <div className={skeletonLayout.healthGrid}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </SkeletonSection>
      </div>
    </div>
  );
}
