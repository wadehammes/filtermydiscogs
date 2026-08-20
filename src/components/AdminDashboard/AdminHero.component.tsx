"use client";

import heroStyles from "src/components/Dashboard/DashboardHero.module.css";
import { formatCommunityStatValue } from "src/lib/formatCommunityStatValue";
import type { AdminStats } from "src/types/dashboard.types";

interface AdminHeroProps {
  overview: AdminStats["overview"];
  engagement: AdminStats["engagement"];
  last7Days: AdminStats["recentActivity"]["last7Days"];
}

export function AdminHero({ overview, engagement, last7Days }: AdminHeroProps) {
  return (
    <header className={heroStyles.hero} data-testid="fmdAdminHero">
      <div className={heroStyles.intro}>
        <p className={heroStyles.eyebrow}>Platform overview</p>
        <h1 className={heroStyles.title}>Admin dashboard</h1>

        <div className={heroStyles.countBlock}>
          <div className={heroStyles.countRow}>
            <span className={heroStyles.count}>
              {formatCommunityStatValue(overview.totalUsers)}
            </span>
            <span className={heroStyles.countLabel}>accounts</span>
          </div>

          <p className={heroStyles.tagline}>
            {formatCommunityStatValue(overview.totalCrates)} crates and{" "}
            {formatCommunityStatValue(overview.totalReleases)} saved releases
            across the platform.
          </p>
        </div>
      </div>

      <aside
        aria-label="Recent platform activity"
        className={heroStyles.metricsPanel}
      >
        <dl className={heroStyles.metricsList}>
          <div className={heroStyles.metricItem}>
            <dt className={heroStyles.metricLabel}>Active users (7d)</dt>
            <dd className={heroStyles.metricValue}>
              {formatCommunityStatValue(engagement.activeUsers.last7Days)}
            </dd>
            <dd className={heroStyles.metricMeta}>
              {formatCommunityStatValue(engagement.returningUsers.last7Days)}{" "}
              returning
            </dd>
          </div>

          <div className={heroStyles.metricItem}>
            <dt className={heroStyles.metricLabel}>New releases (7d)</dt>
            <dd className={heroStyles.metricValue}>
              {formatCommunityStatValue(last7Days.newReleases)}
            </dd>
            <dd className={heroStyles.metricMeta}>
              {formatCommunityStatValue(last7Days.newCrates)} new crates
            </dd>
          </div>
        </dl>
      </aside>
    </header>
  );
}
