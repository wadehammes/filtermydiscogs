"use client";

import heroStyles from "src/components/Dashboard/DashboardHero.module.css";
import {
  ScrollReveal,
  ScrollRevealItem,
  TickerNumber,
} from "src/components/ScrollReveal/ScrollReveal.component";
import { formatCommunityStatValue } from "src/lib/formatCommunityStatValue";
import type { AdminStats } from "src/types/dashboard.types";

interface AdminHeroProps {
  overview: AdminStats["overview"];
  engagement: AdminStats["engagement"];
  last7Days: AdminStats["recentActivity"]["last7Days"];
}

export function AdminHero({ overview, engagement, last7Days }: AdminHeroProps) {
  return (
    <ScrollReveal
      animateOnView={false}
      as="header"
      className={heroStyles.hero}
      data-testid="fmdAdminHero"
    >
      <ScrollRevealItem className={heroStyles.intro}>
        <p className={heroStyles.eyebrow}>Platform overview</p>
        <h1 className={heroStyles.title}>Admin dashboard</h1>

        <div className={heroStyles.countBlock}>
          <div className={heroStyles.countRow}>
            <TickerNumber
              active
              className={heroStyles.count}
              format={formatCommunityStatValue}
              value={overview.totalUsers}
            />
            <span className={heroStyles.countLabel}>accounts</span>
          </div>

          <p className={heroStyles.tagline}>
            <TickerNumber
              active
              format={formatCommunityStatValue}
              value={overview.totalCrates}
            />{" "}
            crates and{" "}
            <TickerNumber
              active
              format={formatCommunityStatValue}
              value={overview.totalReleases}
            />{" "}
            saved releases across the platform.
          </p>
        </div>
      </ScrollRevealItem>

      <ScrollRevealItem
        as="aside"
        aria-label="Recent platform activity"
        className={heroStyles.metricsPanel}
        index={1}
      >
        <dl className={heroStyles.metricsList}>
          <div className={heroStyles.metricItem}>
            <dt className={heroStyles.metricLabel}>Active users (7d)</dt>
            <dd className={heroStyles.metricValue}>
              <TickerNumber
                active
                format={formatCommunityStatValue}
                value={engagement.activeUsers.last7Days}
              />
            </dd>
            <dd className={heroStyles.metricMeta}>
              <TickerNumber
                active
                format={formatCommunityStatValue}
                value={engagement.returningUsers.last7Days}
              />{" "}
              returning
            </dd>
          </div>

          <div className={heroStyles.metricItem}>
            <dt className={heroStyles.metricLabel}>New releases (7d)</dt>
            <dd className={heroStyles.metricValue}>
              <TickerNumber
                active
                format={formatCommunityStatValue}
                value={last7Days.newReleases}
              />
            </dd>
            <dd className={heroStyles.metricMeta}>
              <TickerNumber
                active
                format={formatCommunityStatValue}
                value={last7Days.newCrates}
              />{" "}
              new crates
            </dd>
          </div>
        </dl>
      </ScrollRevealItem>
    </ScrollReveal>
  );
}
