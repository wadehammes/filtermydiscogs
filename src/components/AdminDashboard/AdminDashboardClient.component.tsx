"use client";

import type { ReactNode } from "react";
import { AdminDashboardSkeleton } from "src/components/AdminDashboard/AdminDashboardSkeleton.component";
import { AdminHero } from "src/components/AdminDashboard/AdminHero.component";
import { AdminMetricTable } from "src/components/AdminDashboard/AdminMetricTable.component";
import { AdminPreferenceBreakdownPanel } from "src/components/AdminDashboard/AdminPreferenceBreakdownPanel.component";
import { AdminUserLookupPanel } from "src/components/AdminDashboard/AdminUserLookupPanel.component";
import { ReturningUsersChart } from "src/components/AdminDashboard/ReturningUsersChart.component";
import appLoadingStyles from "src/components/AppPageLoading/AppPageLoading.module.css";
import { DashboardSection } from "src/components/Dashboard/components/DashboardSection.component";
import dashboardStyles from "src/components/Dashboard/DashboardClient.module.css";
import { Page } from "src/components/Page/Page.component";
import { PlaybackPageShell } from "src/components/ReleasePlayback/PlaybackPageShell.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { GrowthAreaChart } from "src/components/shared/GrowthAreaChart/GrowthAreaChart.component";
import { StatCard } from "src/components/shared/StatCard/StatCard.component";
import { StatsGrid } from "src/components/shared/StatsGrid/StatsGrid.component";
import { useAdminStatsQuery } from "src/hooks/queries/useAdminStatsQuery";
import { useRedirectIfUnauthenticated } from "src/hooks/useRedirectIfUnauthenticated.hook";
import { formatCommunityStatValue } from "src/lib/formatCommunityStatValue";
import type { AdminStatsRecentActivityPeriod } from "src/types/dashboard.types";
import type { AdminStatsFeatureUsageRow } from "src/types/productAnalytics.types";
import type { StoredTheme } from "src/types/userPreferences.types";
import { THEME_LABELS } from "src/utils/themeAppearance";
import styles from "./AdminDashboardClient.module.css";

const getDiscogsUserProfileUrl = (username: string): string =>
  `https://www.discogs.com/user/${encodeURIComponent(username)}`;

const DEFAULT_VIEW_LABELS: Record<string, string> = {
  card: "Grid",
  list: "Table",
  random: "Random",
};

const formatPercent = (
  value: number,
  total: number,
  suffix: string,
): string => {
  if (total === 0) {
    return `0% ${suffix}`;
  }

  return `${Math.round((value / total) * 100)}% ${suffix}`;
};

const formatAverage = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);

const growthChartTooltip =
  (seriesLabel: string) =>
  (value: unknown): [string, string] => {
    if (typeof value !== "number") {
      return ["", ""];
    }

    return [formatCommunityStatValue(value), seriesLabel];
  };

const formatTopUserLabel = (row: {
  username: string;
  user_id: number;
}): ReactNode => (
  <a
    className={styles.tableUserLink}
    href={getDiscogsUserProfileUrl(row.username)}
    rel="noopener noreferrer"
    target="_blank"
  >
    {row.username} <span className={styles.tableUserMeta}>({row.user_id})</span>
  </a>
);

const ACTIVITY_ROWS: Array<{
  key: keyof AdminStatsRecentActivityPeriod;
  label: string;
}> = [
  { key: "newUsers", label: "New users" },
  { key: "newCrates", label: "New crates" },
  { key: "newReleases", label: "New releases" },
  { key: "newPublicCrates", label: "New public crates" },
  { key: "newSetMarkers", label: "New set markers" },
  { key: "newPackedReleases", label: "Albums packed" },
];

const renderRecentActivity = (period: AdminStatsRecentActivityPeriod) => (
  <dl className={styles.activityList}>
    {ACTIVITY_ROWS.map(({ key, label }) => (
      <div className={styles.activityRow} key={key}>
        <dt className={styles.activityLabel}>{label}</dt>
        <dd className={styles.activityValue}>
          {formatCommunityStatValue(period[key])}
        </dd>
      </div>
    ))}
  </dl>
);

const renderFeatureUsageTable = (
  rows: AdminStatsFeatureUsageRow[],
  nameHeader: string,
) => (
  <AdminMetricTable
    columns={[
      {
        key: "label",
        header: nameHeader,
        align: "name",
      },
      {
        key: "last7Days",
        header: "7d",
        align: "metric",
        render: (row) => formatCommunityStatValue(row.last7Days),
      },
      {
        key: "last30Days",
        header: "30d",
        align: "metric",
        render: (row) => formatCommunityStatValue(row.last30Days),
      },
    ]}
    emptyMessage="No events yet"
    getRowKey={(row) => row.key}
    rows={rows}
  />
);

export default function AdminDashboardClient() {
  const { shouldRedirectHome, isCheckingAuth } = useRedirectIfUnauthenticated();
  const { data: stats, isLoading, error } = useAdminStatsQuery();

  if (shouldRedirectHome || isCheckingAuth) {
    return null;
  }

  return (
    <Page>
      <PlaybackPageShell
        fillViewport
        header={
          <StickyHeaderBar
            allReleasesLoaded={true}
            currentPage="admin"
            hideFilters={true}
          />
        }
      >
        <div
          className={dashboardStyles.container}
          data-testid="fmdAdminDashboardClient"
        >
          {isLoading && (
            <div className={appLoadingStyles.contentWithSkeleton}>
              <AdminDashboardSkeleton />
            </div>
          )}

          {error && (
            <div className={dashboardStyles.loadingContainer}>
              <h2 className={styles.errorTitle}>Error loading stats</h2>
              <p>
                {error instanceof Error
                  ? error.message
                  : "Failed to load admin statistics"}
              </p>
            </div>
          )}

          {stats && (
            <div className={dashboardStyles.content}>
              <AdminHero
                engagement={stats.engagement}
                last7Days={stats.recentActivity.last7Days}
                overview={stats.overview}
              />

              <DashboardSection
                lede="Who is using the app, how often they come back, and where signups stall."
                title="Engagement"
              >
                <StatsGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }}>
                  <StatCard
                    label="Active users (7d)"
                    subtext="Crate edits or releases added"
                    value={formatCommunityStatValue(
                      stats.engagement.activeUsers.last7Days,
                    )}
                  />
                  <StatCard
                    label="Active users (30d)"
                    subtext="Crate edits or releases added"
                    value={formatCommunityStatValue(
                      stats.engagement.activeUsers.last30Days,
                    )}
                  />
                  <StatCard
                    label="Returning users (7d)"
                    subtext="Signed up before this week"
                    value={formatCommunityStatValue(
                      stats.engagement.returningUsers.last7Days,
                    )}
                  />
                  <StatCard
                    label="Returning users (30d)"
                    subtext="Signed up before this month"
                    value={formatCommunityStatValue(
                      stats.engagement.returningUsers.last30Days,
                    )}
                  />
                </StatsGrid>

                <ReturningUsersChart
                  timeSeries={stats.engagement.returningUsersTimeSeries}
                />

                <StatsGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }}>
                  <StatCard
                    label="Avg crates per user"
                    subtext="Among users with at least one crate"
                    value={formatAverage(
                      stats.engagement.averages.cratesPerUser,
                    )}
                  />
                  <StatCard
                    label="Avg releases per crate"
                    value={formatAverage(
                      stats.engagement.averages.releasesPerCrate,
                    )}
                  />
                  <StatCard
                    label="Stale accounts"
                    subtext="Crates but no activity in 90 days"
                    value={formatCommunityStatValue(
                      stats.engagement.staleAccounts,
                    )}
                  />
                </StatsGrid>

                <div className={styles.cardGrid}>
                  <article className={styles.panelCard}>
                    <p className={styles.panelEyebrow}>Signup funnel</p>
                    <dl className={styles.activityList}>
                      <div className={styles.activityRow}>
                        <dt className={styles.activityLabel}>
                          Signed up, no crates yet
                        </dt>
                        <dd className={styles.activityValue}>
                          {formatCommunityStatValue(
                            stats.engagement.signupFunnel.usersWithNoCrates,
                          )}
                        </dd>
                      </div>
                      <div className={styles.activityRow}>
                        <dt className={styles.activityLabel}>
                          Created at least one crate
                        </dt>
                        <dd className={styles.activityValue}>
                          {formatCommunityStatValue(
                            stats.engagement.signupFunnel.usersWithCrates,
                          )}
                        </dd>
                      </div>
                    </dl>
                    <p className={styles.panelMeta}>
                      {formatPercent(
                        stats.engagement.signupFunnel.usersWithCrates,
                        stats.overview.totalUsers,
                        "of users",
                      )}{" "}
                      have created a crate
                    </p>
                  </article>
                </div>
              </DashboardSection>

              <DashboardSection
                lede="Optional account settings stored in user preferences."
                title="Account preferences"
              >
                <div className={styles.preferenceGroups}>
                  <StatsGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }}>
                    <StatCard
                      label="Remember filter selections"
                      subtext={formatPercent(
                        stats.accountPreferences.persistFiltersEnabled,
                        stats.overview.totalUsers,
                        "of users",
                      )}
                      value={formatCommunityStatValue(
                        stats.accountPreferences.persistFiltersEnabled,
                      )}
                    />
                    <StatCard
                      label="Analytics cookies enabled"
                      subtext={formatPercent(
                        stats.accountPreferences.analyticsConsent.enabled,
                        stats.overview.totalUsers,
                        "of users",
                      )}
                      value={formatCommunityStatValue(
                        stats.accountPreferences.analyticsConsent.enabled,
                      )}
                    />
                    <StatCard
                      label="Analytics cookies disabled"
                      subtext={formatPercent(
                        stats.accountPreferences.analyticsConsent.disabled,
                        stats.overview.totalUsers,
                        "of users",
                      )}
                      value={formatCommunityStatValue(
                        stats.accountPreferences.analyticsConsent.disabled,
                      )}
                    />
                    <StatCard
                      label="Analytics choice unset"
                      subtext={formatPercent(
                        stats.accountPreferences.analyticsConsent.unset,
                        stats.overview.totalUsers,
                        "of users",
                      )}
                      value={formatCommunityStatValue(
                        stats.accountPreferences.analyticsConsent.unset,
                      )}
                    />
                  </StatsGrid>

                  <div className={styles.cardGrid}>
                    <AdminPreferenceBreakdownPanel
                      labelForKey={(key) =>
                        THEME_LABELS[key as StoredTheme] ?? key
                      }
                      rows={stats.accountPreferences.themes}
                      title="Themes"
                      totalUsers={stats.overview.totalUsers}
                    />
                    <AdminPreferenceBreakdownPanel
                      labelForKey={(key) => DEFAULT_VIEW_LABELS[key] ?? key}
                      rows={stats.accountPreferences.defaultViews}
                      title="Default view"
                      totalUsers={stats.overview.totalUsers}
                    />
                  </div>
                </div>
              </DashboardSection>

              <DashboardSection
                lede="Page views and interaction events from opted-in users (last 7 and 30 days)."
                title="Feature usage"
              >
                <StatsGrid columns={{ mobile: 1, tablet: 2, desktop: 2 }}>
                  <StatCard
                    label="Total events (7d)"
                    subtext="Page views and interactions"
                    value={formatCommunityStatValue(
                      stats.featureUsage.totals.last7Days,
                    )}
                  />
                  <StatCard
                    label="Total events (30d)"
                    subtext="Page views and interactions"
                    value={formatCommunityStatValue(
                      stats.featureUsage.totals.last30Days,
                    )}
                  />
                </StatsGrid>

                <div className={styles.cardGrid}>
                  <article className={styles.panelCard}>
                    <p className={styles.panelEyebrow}>Top page views</p>
                    {renderFeatureUsageTable(
                      stats.featureUsage.pageViews,
                      "Page",
                    )}
                  </article>

                  <article className={styles.panelCard}>
                    <p className={styles.panelEyebrow}>Top interactions</p>
                    {renderFeatureUsageTable(
                      stats.featureUsage.events,
                      "Event",
                    )}
                  </article>
                </div>
              </DashboardSection>

              <DashboardSection
                lede="How owners use sharing, gig packing, notes, and set markers."
                title="Crate features"
              >
                <StatsGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }}>
                  <StatCard
                    label="Public crates"
                    subtext={formatPercent(
                      stats.overview.crateFeatures.publicCrates,
                      stats.overview.totalCrates,
                      "of crates",
                    )}
                    value={formatCommunityStatValue(
                      stats.overview.crateFeatures.publicCrates,
                    )}
                  />
                  <StatCard
                    label="Gig packing enabled"
                    subtext={formatPercent(
                      stats.overview.crateFeatures.packedEnabledCrates,
                      stats.overview.totalCrates,
                      "of crates",
                    )}
                    value={formatCommunityStatValue(
                      stats.overview.crateFeatures.packedEnabledCrates,
                    )}
                  />
                  <StatCard
                    label="Crates with notes"
                    subtext={formatPercent(
                      stats.overview.crateFeatures.cratesWithNotes,
                      stats.overview.totalCrates,
                      "of crates",
                    )}
                    value={formatCommunityStatValue(
                      stats.overview.crateFeatures.cratesWithNotes,
                    )}
                  />
                  <StatCard
                    label="Set markers"
                    value={formatCommunityStatValue(
                      stats.overview.crateFeatures.totalSetMarkers,
                    )}
                  />
                  <StatCard
                    label="Packed albums"
                    subtext={
                      stats.overview.totalReleases > 0
                        ? `${Math.round(
                            (stats.overview.crateFeatures.packedReleases /
                              stats.overview.totalReleases) *
                              100,
                          )}% of saved releases`
                        : "0% of saved releases"
                    }
                    value={formatCommunityStatValue(
                      stats.overview.crateFeatures.packedReleases,
                    )}
                  />
                </StatsGrid>
              </DashboardSection>

              <DashboardSection
                lede="New records in the last 7 and 30 days."
                title="Recent activity"
              >
                <div className={styles.cardGrid}>
                  <article className={styles.panelCard}>
                    <p className={styles.panelEyebrow}>Last 7 days</p>
                    {renderRecentActivity(stats.recentActivity.last7Days)}
                  </article>

                  <article className={styles.panelCard}>
                    <p className={styles.panelEyebrow}>Last 30 days</p>
                    {renderRecentActivity(stats.recentActivity.last30Days)}
                  </article>
                </div>
              </DashboardSection>

              <DashboardSection
                lede="Accounts with the most crates and saved releases."
                title="Power users"
              >
                <div className={styles.cardGrid}>
                  <article className={styles.panelCard}>
                    <p className={styles.panelEyebrow}>By crates</p>
                    <AdminMetricTable
                      columns={[
                        {
                          key: "username",
                          header: "User",
                          align: "name",
                          render: (row) => formatTopUserLabel(row),
                        },
                        {
                          key: "count",
                          header: "Crates",
                          align: "metric",
                          render: (row) => formatCommunityStatValue(row.count),
                        },
                      ]}
                      getRowKey={(row) => String(row.user_id)}
                      rows={stats.topUsers.byCrates}
                    />
                  </article>

                  <article className={styles.panelCard}>
                    <p className={styles.panelEyebrow}>By releases</p>
                    <AdminMetricTable
                      columns={[
                        {
                          key: "username",
                          header: "User",
                          align: "name",
                          render: (row) => formatTopUserLabel(row),
                        },
                        {
                          key: "count",
                          header: "Releases",
                          align: "metric",
                          render: (row) => formatCommunityStatValue(row.count),
                        },
                      ]}
                      getRowKey={(row) => String(row.user_id)}
                      rows={stats.topUsers.byReleases}
                    />
                  </article>
                </div>
              </DashboardSection>

              <DashboardSection
                lede="Monthly signups and usage trends."
                title="Growth over time"
              >
                <div className={styles.chartsGrid}>
                  <GrowthAreaChart
                    data={stats.growth.users}
                    formatter={growthChartTooltip("Users")}
                    title="Users"
                  />
                  <GrowthAreaChart
                    data={stats.growth.crates}
                    formatter={growthChartTooltip("Crates")}
                    title="Crates"
                  />
                  <GrowthAreaChart
                    data={stats.growth.releases}
                    formatter={growthChartTooltip("Releases")}
                    title="Releases"
                  />
                  <GrowthAreaChart
                    data={stats.growth.publicCrates}
                    formatter={growthChartTooltip("Public Crates")}
                    title="Public crates"
                  />
                  <GrowthAreaChart
                    data={stats.growth.setMarkers}
                    formatter={growthChartTooltip("Set Markers")}
                    title="Set markers"
                  />
                </div>
              </DashboardSection>

              <AdminUserLookupPanel />
            </div>
          )}
        </div>
      </PlaybackPageShell>
    </Page>
  );
}
