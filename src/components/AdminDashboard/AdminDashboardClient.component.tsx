"use client";

import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import sharedStyles from "src/components/shared/DashboardLayout/DashboardLayout.module.css";
import { DashboardSection } from "src/components/shared/DashboardSection/DashboardSection.component";
import { GrowthAreaChart } from "src/components/shared/GrowthAreaChart/GrowthAreaChart.component";
import { StatCard } from "src/components/shared/StatCard/StatCard.component";
import { StatsGrid } from "src/components/shared/StatsGrid/StatsGrid.component";
import { useAdminStatsQuery } from "src/hooks/queries/useAdminStatsQuery";
import { useRedirectIfUnauthenticated } from "src/hooks/useRedirectIfUnauthenticated.hook";
import type { AdminStatsRecentActivityPeriod } from "src/types/dashboard.types";
import styles from "./AdminDashboardClient.module.css";

export default function AdminDashboardClient() {
  const { shouldRedirectHome, isCheckingAuth } = useRedirectIfUnauthenticated();
  const { data: stats, isLoading, error } = useAdminStatsQuery();

  if (shouldRedirectHome || isCheckingAuth) {
    return null;
  }

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  const formatPercent = (value: number, total: number): string => {
    if (total === 0) {
      return "0% of crates";
    }

    return `${Math.round((value / total) * 100)}% of crates`;
  };

  const renderRecentActivity = (period: AdminStatsRecentActivityPeriod) => (
    <div className={styles.activityStats}>
      <div className={styles.activityStat}>
        <span className={styles.activityLabel}>New Users:</span>
        <span className={styles.activityValue}>
          {formatNumber(period.newUsers)}
        </span>
      </div>
      <div className={styles.activityStat}>
        <span className={styles.activityLabel}>New Crates:</span>
        <span className={styles.activityValue}>
          {formatNumber(period.newCrates)}
        </span>
      </div>
      <div className={styles.activityStat}>
        <span className={styles.activityLabel}>New Releases:</span>
        <span className={styles.activityValue}>
          {formatNumber(period.newReleases)}
        </span>
      </div>
      <div className={styles.activityStat}>
        <span className={styles.activityLabel}>New Public Crates:</span>
        <span className={styles.activityValue}>
          {formatNumber(period.newPublicCrates)}
        </span>
      </div>
      <div className={styles.activityStat}>
        <span className={styles.activityLabel}>New Set Markers:</span>
        <span className={styles.activityValue}>
          {formatNumber(period.newSetMarkers)}
        </span>
      </div>
      <div className={styles.activityStat}>
        <span className={styles.activityLabel}>Albums Packed:</span>
        <span className={styles.activityValue}>
          {formatNumber(period.newPackedReleases)}
        </span>
      </div>
    </div>
  );

  return (
    <>
      <StickyHeaderBar
        allReleasesLoaded={true}
        currentPage="admin"
        hideFilters={true}
      />
      <div className={sharedStyles.container}>
        <div className={sharedStyles.header}>
          <h1>Admin Dashboard</h1>
          <p className={sharedStyles.subtitle}>
            Application statistics and analytics
          </p>
        </div>

        {isLoading && (
          <div className={sharedStyles.loadingContainer}>
            <p>Loading admin stats...</p>
          </div>
        )}

        {error && (
          <div className={sharedStyles.errorContainer}>
            <h2>Error loading stats</h2>
            <p>
              {error instanceof Error
                ? error.message
                : "Failed to load admin statistics"}
            </p>
          </div>
        )}

        {stats && (
          <div className={sharedStyles.content}>
            <StatsGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }}>
              <StatCard
                label="Total Users"
                value={formatNumber(stats.overview.totalUsers)}
              />
              <StatCard
                label="Total Crates"
                value={formatNumber(stats.overview.totalCrates)}
              />
              <StatCard
                label="Total Releases"
                value={formatNumber(stats.overview.totalReleases)}
              />
            </StatsGrid>

            <DashboardSection title="Crate Features">
              <StatsGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }}>
                <StatCard
                  label="Public Crates"
                  value={formatNumber(
                    stats.overview.crateFeatures.publicCrates,
                  )}
                  subtext={formatPercent(
                    stats.overview.crateFeatures.publicCrates,
                    stats.overview.totalCrates,
                  )}
                />
                <StatCard
                  label="Gig Packing Enabled"
                  value={formatNumber(
                    stats.overview.crateFeatures.packedEnabledCrates,
                  )}
                  subtext={formatPercent(
                    stats.overview.crateFeatures.packedEnabledCrates,
                    stats.overview.totalCrates,
                  )}
                />
                <StatCard
                  label="Crates With Notes"
                  value={formatNumber(
                    stats.overview.crateFeatures.cratesWithNotes,
                  )}
                  subtext={formatPercent(
                    stats.overview.crateFeatures.cratesWithNotes,
                    stats.overview.totalCrates,
                  )}
                />
                <StatCard
                  label="Set Markers"
                  value={formatNumber(
                    stats.overview.crateFeatures.totalSetMarkers,
                  )}
                />
                <StatCard
                  label="Packed Albums"
                  value={formatNumber(
                    stats.overview.crateFeatures.packedReleases,
                  )}
                  subtext={
                    stats.overview.totalReleases > 0
                      ? `${Math.round(
                          (stats.overview.crateFeatures.packedReleases /
                            stats.overview.totalReleases) *
                            100,
                        )}% of saved releases`
                      : "0% of saved releases"
                  }
                />
              </StatsGrid>
            </DashboardSection>

            <DashboardSection title="Recent Activity">
              <div className={styles.activityGrid}>
                <div className={styles.activityCard}>
                  <h3 className={styles.activityTitle}>Last 7 Days</h3>
                  {renderRecentActivity(stats.recentActivity.last7Days)}
                </div>

                <div className={styles.activityCard}>
                  <h3 className={styles.activityTitle}>Last 30 Days</h3>
                  {renderRecentActivity(stats.recentActivity.last30Days)}
                </div>
              </div>
            </DashboardSection>

            <DashboardSection title="Top Users">
              <div className={styles.topUsersGrid}>
                <div className={styles.topUsersCard}>
                  <h3 className={styles.topUsersTitle}>By Crates</h3>
                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>User ID</th>
                          <th>Crates</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.topUsers.byCrates.length === 0 ? (
                          <tr>
                            <td colSpan={2} className={styles.emptyTable}>
                              No data
                            </td>
                          </tr>
                        ) : (
                          stats.topUsers.byCrates.map((user) => (
                            <tr key={user.user_id}>
                              <td>{user.user_id}</td>
                              <td>{formatNumber(user.count)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={styles.topUsersCard}>
                  <h3 className={styles.topUsersTitle}>By Releases</h3>
                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>User ID</th>
                          <th>Releases</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.topUsers.byReleases.length === 0 ? (
                          <tr>
                            <td colSpan={2} className={styles.emptyTable}>
                              No data
                            </td>
                          </tr>
                        ) : (
                          stats.topUsers.byReleases.map((user) => (
                            <tr key={user.user_id}>
                              <td>{user.user_id}</td>
                              <td>{formatNumber(user.count)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </DashboardSection>

            <DashboardSection title="Growth Over Time">
              <div className={sharedStyles.chartsGrid}>
                <GrowthAreaChart
                  title="Users"
                  data={stats.growth.users}
                  formatter={(value: unknown) => {
                    if (typeof value !== "number") return ["", ""];
                    return [value.toLocaleString(), "Users"];
                  }}
                />
                <GrowthAreaChart
                  title="Crates"
                  data={stats.growth.crates}
                  formatter={(value: unknown) => {
                    if (typeof value !== "number") return ["", ""];
                    return [value.toLocaleString(), "Crates"];
                  }}
                />
                <GrowthAreaChart
                  title="Releases"
                  data={stats.growth.releases}
                  formatter={(value: unknown) => {
                    if (typeof value !== "number") return ["", ""];
                    return [value.toLocaleString(), "Releases"];
                  }}
                />
                <GrowthAreaChart
                  title="Public Crates"
                  data={stats.growth.publicCrates}
                  formatter={(value: unknown) => {
                    if (typeof value !== "number") return ["", ""];
                    return [value.toLocaleString(), "Public Crates"];
                  }}
                />
                <GrowthAreaChart
                  title="Set Markers"
                  data={stats.growth.setMarkers}
                  formatter={(value: unknown) => {
                    if (typeof value !== "number") return ["", ""];
                    return [value.toLocaleString(), "Set Markers"];
                  }}
                />
              </div>
            </DashboardSection>
          </div>
        )}
      </div>
    </>
  );
}
