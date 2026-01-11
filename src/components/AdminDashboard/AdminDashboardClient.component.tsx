"use client";

import AuthLoading from "src/components/AuthLoading/AuthLoading.component";
import Login from "src/components/Login/Login.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import sharedStyles from "src/components/shared/DashboardLayout/DashboardLayout.module.css";
import { DashboardSection } from "src/components/shared/DashboardSection/DashboardSection.component";
import { GrowthAreaChart } from "src/components/shared/GrowthAreaChart/GrowthAreaChart.component";
import { StatCard } from "src/components/shared/StatCard/StatCard.component";
import { StatsGrid } from "src/components/shared/StatsGrid/StatsGrid.component";
import { useAuth } from "src/context/auth.context";
import { useAdminStats } from "src/hooks/useAdminStats.hook";
import styles from "./AdminDashboardClient.module.css";

export default function AdminDashboardClient() {
  const { state: authState } = useAuth();
  const { data: stats, isLoading, error } = useAdminStats();

  if (!authState.isAuthenticated && authState.isLoading) {
    return <AuthLoading />;
  }

  if (!authState.isAuthenticated) {
    return <Login />;
  }

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat("en-US").format(value);
  };

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
            {/* Overview Cards */}
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

            {/* Recent Activity */}
            <DashboardSection title="Recent Activity">
              <div className={styles.activityGrid}>
                <div className={styles.activityCard}>
                  <h3 className={styles.activityTitle}>Last 7 Days</h3>
                  <div className={styles.activityStats}>
                    <div className={styles.activityStat}>
                      <span className={styles.activityLabel}>New Users:</span>
                      <span className={styles.activityValue}>
                        {formatNumber(stats.recentActivity.last7Days.newUsers)}
                      </span>
                    </div>
                    <div className={styles.activityStat}>
                      <span className={styles.activityLabel}>New Crates:</span>
                      <span className={styles.activityValue}>
                        {formatNumber(stats.recentActivity.last7Days.newCrates)}
                      </span>
                    </div>
                    <div className={styles.activityStat}>
                      <span className={styles.activityLabel}>
                        New Releases:
                      </span>
                      <span className={styles.activityValue}>
                        {formatNumber(
                          stats.recentActivity.last7Days.newReleases,
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.activityCard}>
                  <h3 className={styles.activityTitle}>Last 30 Days</h3>
                  <div className={styles.activityStats}>
                    <div className={styles.activityStat}>
                      <span className={styles.activityLabel}>New Users:</span>
                      <span className={styles.activityValue}>
                        {formatNumber(stats.recentActivity.last30Days.newUsers)}
                      </span>
                    </div>
                    <div className={styles.activityStat}>
                      <span className={styles.activityLabel}>New Crates:</span>
                      <span className={styles.activityValue}>
                        {formatNumber(
                          stats.recentActivity.last30Days.newCrates,
                        )}
                      </span>
                    </div>
                    <div className={styles.activityStat}>
                      <span className={styles.activityLabel}>
                        New Releases:
                      </span>
                      <span className={styles.activityValue}>
                        {formatNumber(
                          stats.recentActivity.last30Days.newReleases,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </DashboardSection>

            {/* Top Users */}
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

            {/* Growth Charts */}
            <DashboardSection title="Growth Over Time">
              <div className={sharedStyles.chartsGrid}>
                <GrowthAreaChart
                  title="Users"
                  data={stats.growth.users}
                  gradientId="colorUsers"
                  formatter={(value: unknown) => {
                    if (typeof value !== "number") return ["", ""];
                    return [value.toLocaleString(), "Users"];
                  }}
                />
                <GrowthAreaChart
                  title="Crates"
                  data={stats.growth.crates}
                  gradientId="colorCrates"
                  formatter={(value: unknown) => {
                    if (typeof value !== "number") return ["", ""];
                    return [value.toLocaleString(), "Crates"];
                  }}
                />
                <GrowthAreaChart
                  title="Releases"
                  data={stats.growth.releases}
                  gradientId="colorReleases"
                  formatter={(value: unknown) => {
                    if (typeof value !== "number") return ["", ""];
                    return [value.toLocaleString(), "Releases"];
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
