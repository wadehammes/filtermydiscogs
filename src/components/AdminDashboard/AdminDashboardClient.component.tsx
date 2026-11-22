"use client";

import classNames from "classnames";
import type { ReactNode } from "react";
import { AdminDashboardSkeleton } from "src/components/AdminDashboard/AdminDashboardSkeleton.component";
import { AdminHero } from "src/components/AdminDashboard/AdminHero.component";
import { AdminMetricTable } from "src/components/AdminDashboard/AdminMetricTable.component";
import { AdminPreferenceBreakdownPanel } from "src/components/AdminDashboard/AdminPreferenceBreakdownPanel.component";
import { AdminUserLookupPanel } from "src/components/AdminDashboard/AdminUserLookupPanel.component";
import { ReturningUsersChart } from "src/components/AdminDashboard/ReturningUsersChart.component";
import { AdminYoutubeEmbedTestPanel } from "src/components/AdminYoutubeEmbedTestPanel/AdminYoutubeEmbedTestPanel.component";
import appLoadingStyles from "src/components/AppPageLoading/AppPageLoading.module.css";
import dashboardStyles from "src/components/Dashboard/DashboardClient.module.css";
import { DashboardSection } from "src/components/Dashboard/DashboardSection.component";
import { GrowthAreaChart } from "src/components/GrowthAreaChart/GrowthAreaChart.component";
import { Page } from "src/components/Page/Page.component";
import { CollectionPlaybackPageShell } from "src/components/PlaybackPageShell/CollectionPlaybackPageShell.component";
import { StatCard } from "src/components/StatCard/StatCard.component";
import { StatsGrid } from "src/components/StatsGrid/StatsGrid.component";
import { useAdminStatsQuery } from "src/hooks/queries/useAdminStatsQuery";
import { useRedirectIfUnauthenticated } from "src/hooks/useRedirectIfUnauthenticated.hook";
import { formatCommunityStatValue } from "src/lib/formatCommunityStatValue";
import type {
  AdminStats,
  AdminStatsRecentActivityPeriod,
  AdminStatsTopUser,
  AdminStatsTopUserTrack,
} from "src/types/dashboard.types";
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

const SAVED_VIEW_COUNT_LABELS: Record<string, string> = {
  "0": "None",
  "1": "1 view",
  "2-5": "2–5 views",
  "6+": "6+ views",
};

const DEFAULT_SIDE_PANEL_LABELS: Record<string, string> = {
  crates: "Crates",
  playlists: "Playlists",
};

interface AdminDashboardClientProps {
  deployment: {
    playlistsFeatureEnabled: boolean;
  };
}

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

const ADMIN_SECTION_LINKS = [
  { href: "#people", label: "People" },
  { href: "#library", label: "Library" },
  { href: "#listening", label: "Listening" },
  { href: "#playlists", label: "Playlists" },
  { href: "#usage", label: "Usage" },
  { href: "#user-lookup", label: "Lookup" },
  { href: "#youtube-embed-test", label: "Embed test" },
] as const;

const ANALYTICS_CONSENT_LABELS: Record<string, string> = {
  enabled: "Enabled",
  disabled: "Disabled",
  unset: "Unset",
};

const formatTopUserTrackLabel = (row: AdminStatsTopUserTrack): ReactNode => {
  const artistRelease = [row.artist, row.release_title]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <span>{row.track_title}</span>
      {artistRelease.length > 0 && (
        <span className={styles.tableUserMeta}> — {artistRelease}</span>
      )}
      <span
        className={classNames(
          styles.tableUserMeta,
          styles.tableTrackAttribution,
        )}
      >
        {" "}
        (
        <a
          className={styles.tableUserLinkInline}
          href={getDiscogsUserProfileUrl(row.username)}
          rel="noopener noreferrer"
          target="_blank"
        >
          {row.username}
        </a>
        )
      </span>
    </>
  );
};

const windowRow = (
  key: string,
  label: string,
  field: keyof AdminStatsRecentActivityPeriod,
  recent: AdminStats["recentActivity"],
) => ({
  key,
  label,
  last7Days: recent.last7Days[field],
  last30Days: recent.last30Days[field],
});

const renderWindowCompare = (
  rows: Array<{
    key: string;
    label: string;
    last7Days: number;
    last30Days: number;
  }>,
) => (
  <article className={styles.panelCard}>
    <p className={styles.panelEyebrow}>Last 7 and 30 days</p>
    <div className={styles.tableContainer}>
      <table className={classNames(styles.table, styles.windowTable)}>
        <thead>
          <tr>
            <th className={styles.tableNameCol} scope="col">
              Change
            </th>
            <th className={styles.tableMetricCol} scope="col">
              7d
            </th>
            <th className={styles.tableMetricCol} scope="col">
              30d
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th className={styles.tableNameCol} scope="row">
                {row.label}
              </th>
              <td className={styles.tableMetricCol}>
                {formatCommunityStatValue(row.last7Days)}
              </td>
              <td className={styles.tableMetricCol}>
                {formatCommunityStatValue(row.last30Days)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </article>
);

const renderTopUserLeaderboard = (
  rows: AdminStatsTopUser[],
  metricHeader: string,
) => (
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
        header: metricHeader,
        align: "metric",
        render: (row) => formatCommunityStatValue(row.count),
      },
    ]}
    getRowKey={(row) => String(row.user_id)}
    rows={rows}
  />
);

const renderTopUserTrackLeaderboard = (
  rows: AdminStatsTopUserTrack[],
  metricHeader: string,
  rowKeySuffix: "plays" | "listens",
) => (
  <AdminMetricTable
    columns={[
      {
        key: "track_title",
        header: "Track",
        align: "name",
        render: (row) => formatTopUserTrackLabel(row),
      },
      {
        key: "count",
        header: metricHeader,
        align: "metric",
        render: (row) => formatCommunityStatValue(row.count),
      },
    ]}
    getRowKey={(row) => `${row.user_id}:${row.track_key}:${rowKeySuffix}`}
    rows={rows}
  />
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

export default function AdminDashboardClient({
  deployment,
}: AdminDashboardClientProps) {
  const { shouldRedirectHome, isCheckingAuth } = useRedirectIfUnauthenticated();
  const { data: stats, isLoading, error } = useAdminStatsQuery();

  if (shouldRedirectHome || isCheckingAuth) {
    return null;
  }

  return (
    <Page>
      <CollectionPlaybackPageShell currentPage="admin" hideFilters>
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

              <nav aria-label="Admin sections" className={styles.sectionNav}>
                {ADMIN_SECTION_LINKS.map((link) => (
                  <a
                    className={styles.sectionNavLink}
                    href={link.href}
                    key={link.href}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <DashboardSection
                id="people"
                lede="Who opened the app, who is still editing a collection, and which accounts have gone quiet."
                title="People"
              >
                <StatsGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }}>
                  <StatCard
                    label="Opened the app (7d)"
                    subtext={`${formatCommunityStatValue(
                      stats.engagement.returningUsers.last7Days,
                    )} signed up earlier`}
                    value={formatCommunityStatValue(
                      stats.engagement.seenUsers.last7Days,
                    )}
                  />
                  <StatCard
                    label="Opened the app (30d)"
                    subtext={`${formatCommunityStatValue(
                      stats.engagement.returningUsers.last30Days,
                    )} signed up earlier`}
                    value={formatCommunityStatValue(
                      stats.engagement.seenUsers.last30Days,
                    )}
                  />
                  <StatCard
                    label="Editing collection (7d)"
                    subtext="Crate edits or releases added"
                    value={formatCommunityStatValue(
                      stats.engagement.activeUsers.last7Days,
                    )}
                  />
                  <StatCard
                    label="Editing collection (30d)"
                    subtext="Crate edits or releases added"
                    value={formatCommunityStatValue(
                      stats.engagement.activeUsers.last30Days,
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
                    subtext="Crates but no edits in 90 days"
                    value={formatCommunityStatValue(
                      stats.engagement.staleAccounts,
                    )}
                  />
                </StatsGrid>

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
                    <div className={styles.activityRow}>
                      <dt className={styles.activityLabel}>
                        Signed up in the last 30 days
                      </dt>
                      <dd className={styles.activityValue}>
                        {formatCommunityStatValue(
                          stats.recentActivity.last30Days.newUsers,
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

                <div className={styles.cardGrid}>
                  <article className={styles.panelCard}>
                    <p className={styles.panelEyebrow}>Most crates</p>
                    {renderTopUserLeaderboard(
                      stats.topUsers.byCrates,
                      "Crates",
                    )}
                  </article>

                  <article className={styles.panelCard}>
                    <p className={styles.panelEyebrow}>Most saved releases</p>
                    {renderTopUserLeaderboard(
                      stats.topUsers.byReleases,
                      "Releases",
                    )}
                  </article>
                </div>

                <GrowthAreaChart
                  data={stats.growth.users}
                  formatter={growthChartTooltip("Users")}
                  title="New accounts"
                />
              </DashboardSection>

              <DashboardSection
                id="library"
                lede="Crates and saved releases, including sharing, gig packing, notes, and set markers."
                title="Library"
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

                {renderWindowCompare([
                  windowRow(
                    "crates",
                    "New crates",
                    "newCrates",
                    stats.recentActivity,
                  ),
                  windowRow(
                    "releases",
                    "Releases saved",
                    "newReleases",
                    stats.recentActivity,
                  ),
                  windowRow(
                    "public",
                    "New public crates",
                    "newPublicCrates",
                    stats.recentActivity,
                  ),
                  windowRow(
                    "markers",
                    "New set markers",
                    "newSetMarkers",
                    stats.recentActivity,
                  ),
                  windowRow(
                    "packed",
                    "Albums packed",
                    "newPackedReleases",
                    stats.recentActivity,
                  ),
                ])}

                <div className={styles.chartsGrid}>
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
                    formatter={growthChartTooltip("Public crates")}
                    title="Public crates"
                  />
                  <GrowthAreaChart
                    data={stats.growth.setMarkers}
                    formatter={growthChartTooltip("Set markers")}
                    title="Set markers"
                  />
                </div>
              </DashboardSection>

              <DashboardSection
                id="listening"
                lede="Plays, listens, and YouTube overrides stored per account and track."
                title="Listening"
              >
                <StatsGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }}>
                  <StatCard
                    label="Track rows"
                    subtext="Distinct user and track records"
                    value={formatCommunityStatValue(
                      stats.userTracks.overview.totalTrackRows,
                    )}
                  />
                  <StatCard
                    label="Users with playback"
                    subtext={formatPercent(
                      stats.userTracks.overview.usersWithTracks,
                      stats.overview.totalUsers,
                      "of users",
                    )}
                    value={formatCommunityStatValue(
                      stats.userTracks.overview.usersWithTracks,
                    )}
                  />
                  <StatCard
                    label="Total plays"
                    value={formatCommunityStatValue(
                      stats.userTracks.overview.totalPlays,
                    )}
                  />
                  <StatCard
                    label="Total listens"
                    subtext="At least 30 seconds or played through"
                    value={formatCommunityStatValue(
                      stats.userTracks.overview.totalListens,
                    )}
                  />
                  <StatCard
                    label="YouTube overrides"
                    subtext={`${formatCommunityStatValue(
                      stats.userTracks.overview.usersWithOverrides,
                    )} users`}
                    value={formatCommunityStatValue(
                      stats.userTracks.overview.tracksWithOverrides,
                    )}
                  />
                </StatsGrid>

                {renderWindowCompare([
                  windowRow(
                    "track-rows",
                    "New playback track rows",
                    "newUserTracks",
                    stats.recentActivity,
                  ),
                  windowRow(
                    "listeners",
                    "Active playback users",
                    "activePlaybackUsers",
                    stats.recentActivity,
                  ),
                ])}

                <div className={styles.cardGrid}>
                  <article className={styles.panelCard}>
                    <p className={styles.panelEyebrow}>Top users by plays</p>
                    {renderTopUserLeaderboard(
                      stats.userTracks.topUsers.byPlays,
                      "Plays",
                    )}
                  </article>
                  <article className={styles.panelCard}>
                    <p className={styles.panelEyebrow}>Top users by listens</p>
                    {renderTopUserLeaderboard(
                      stats.userTracks.topUsers.byListens,
                      "Listens",
                    )}
                  </article>
                  <article className={styles.panelCard}>
                    <p className={styles.panelEyebrow}>Most played tracks</p>
                    {renderTopUserTrackLeaderboard(
                      stats.userTracks.topTracks.byPlays,
                      "Plays",
                      "plays",
                    )}
                  </article>
                  <article className={styles.panelCard}>
                    <p className={styles.panelEyebrow}>Most listened tracks</p>
                    {renderTopUserTrackLeaderboard(
                      stats.userTracks.topTracks.byListens,
                      "Listens",
                      "listens",
                    )}
                  </article>
                </div>

                <GrowthAreaChart
                  data={stats.userTracks.growth}
                  formatter={growthChartTooltip("Playback track rows")}
                  title="Playback track rows"
                />
              </DashboardSection>

              <DashboardSection
                id="playlists"
                lede="Saved playlists, how many are public, and whether anyone is opening or playing them."
                title="Playlists"
              >
                <StatsGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }}>
                  <StatCard
                    label="Total playlists"
                    value={formatCommunityStatValue(
                      stats.overview.playlists.totalPlaylists,
                    )}
                  />
                  <StatCard
                    label="Playlist tracks saved"
                    value={formatCommunityStatValue(
                      stats.overview.playlists.totalPlaylistTracks,
                    )}
                  />
                  <StatCard
                    label="Users with playlists"
                    subtext={formatPercent(
                      stats.overview.playlists.usersWithPlaylists,
                      stats.overview.totalUsers,
                      "of users",
                    )}
                    value={formatCommunityStatValue(
                      stats.overview.playlists.usersWithPlaylists,
                    )}
                  />
                  <StatCard
                    label="Public playlists"
                    subtext={formatPercent(
                      stats.overview.playlists.publicPlaylists,
                      stats.overview.playlists.totalPlaylists,
                      "of playlists",
                    )}
                    value={formatCommunityStatValue(
                      stats.overview.playlists.publicPlaylists,
                    )}
                  />
                  <StatCard
                    label="Public views"
                    value={formatCommunityStatValue(
                      stats.overview.playlists.publicViews,
                    )}
                  />
                  <StatCard
                    label="Public plays"
                    value={formatCommunityStatValue(
                      stats.overview.playlists.publicPlays,
                    )}
                  />
                  <StatCard
                    label="Created (7d)"
                    value={formatCommunityStatValue(
                      stats.recentActivity.last7Days.newPlaylists,
                    )}
                  />
                  <StatCard
                    label="Created (30d)"
                    value={formatCommunityStatValue(
                      stats.recentActivity.last30Days.newPlaylists,
                    )}
                  />
                </StatsGrid>
                <p className={styles.panelMeta}>
                  Playlists are{" "}
                  {deployment.playlistsFeatureEnabled ? "on" : "off"} on this
                  deployment. Flag rules match the username and Discogs user ID
                  in Lookup.
                </p>
              </DashboardSection>

              <DashboardSection
                id="usage"
                lede="Account settings, contact email, and which pages opted-in visitors open."
                title="Usage"
              >
                <div className={styles.preferenceGroups}>
                  <div className={styles.preferenceGroup}>
                    <p className={styles.panelEyebrow}>Contact email</p>
                    <StatsGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }}>
                      <StatCard
                        label="Saved email address"
                        subtext={formatPercent(
                          stats.accountContact.usersWithEmail,
                          stats.overview.totalUsers,
                          "of users",
                        )}
                        value={formatCommunityStatValue(
                          stats.accountContact.usersWithEmail,
                        )}
                      />
                      <StatCard
                        label="Marketing opt-in"
                        subtext={`${formatPercent(
                          stats.accountContact.marketingOptInEnabled,
                          stats.accountContact.usersWithEmail,
                          "of users with email",
                        )}. Requires a saved address in Settings.`}
                        value={formatCommunityStatValue(
                          stats.accountContact.marketingOptInEnabled,
                        )}
                      />
                      <StatCard
                        label="Welcome email sent"
                        subtext={`${formatPercent(
                          stats.accountContact.welcomeEmailSent,
                          stats.overview.totalUsers,
                          "of users",
                        )}. One-time Resend note after OAuth when eligible.`}
                        value={formatCommunityStatValue(
                          stats.accountContact.welcomeEmailSent,
                        )}
                      />
                    </StatsGrid>
                  </div>

                  <StatsGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }}>
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
                      label="Autoplay on queue add"
                      subtext={`${formatPercent(
                        stats.accountPreferences.autoPlayOnQueueAddEnabled,
                        stats.overview.totalUsers,
                        "of users",
                      )}. Missing setting counts as on.`}
                      value={formatCommunityStatValue(
                        stats.accountPreferences.autoPlayOnQueueAddEnabled,
                      )}
                    />
                    <StatCard
                      label="Similar releases in queue"
                      subtext={`${formatPercent(
                        stats.accountPreferences
                          .extendQueueWithSimilarReleasesEnabled,
                        stats.overview.totalUsers,
                        "of users",
                      )}. Missing setting counts as off.`}
                      value={formatCommunityStatValue(
                        stats.accountPreferences
                          .extendQueueWithSimilarReleasesEnabled,
                      )}
                    />
                  </StatsGrid>

                  <div className={styles.preferenceGroup}>
                    <p className={styles.panelEyebrow}>Saved filter views</p>
                    <StatsGrid columns={{ mobile: 1, tablet: 2, desktop: 2 }}>
                      <StatCard
                        label="Users with saved views"
                        subtext={formatPercent(
                          stats.accountPreferences.savedViews
                            .usersWithSavedViews,
                          stats.overview.totalUsers,
                          "of users",
                        )}
                        value={formatCommunityStatValue(
                          stats.accountPreferences.savedViews
                            .usersWithSavedViews,
                        )}
                      />
                      <StatCard
                        label="Total saved views"
                        subtext={
                          stats.accountPreferences.savedViews
                            .usersWithSavedViews > 0
                            ? `${formatCommunityStatValue(
                                Math.round(
                                  stats.accountPreferences.savedViews
                                    .totalSavedViews /
                                    stats.accountPreferences.savedViews
                                      .usersWithSavedViews,
                                ),
                              )} avg per saving user`
                            : "Across all users"
                        }
                        value={formatCommunityStatValue(
                          stats.accountPreferences.savedViews.totalSavedViews,
                        )}
                      />
                    </StatsGrid>
                    <AdminPreferenceBreakdownPanel
                      labelForKey={(key) => SAVED_VIEW_COUNT_LABELS[key] ?? key}
                      rows={stats.accountPreferences.savedViews.countBreakdown}
                      title="Saved views per user"
                      totalUsers={stats.overview.totalUsers}
                    />
                  </div>

                  <div className={styles.cardGrid}>
                    <AdminPreferenceBreakdownPanel
                      labelForKey={(key) =>
                        ANALYTICS_CONSENT_LABELS[key] ?? key
                      }
                      rows={[
                        {
                          key: "enabled",
                          count:
                            stats.accountPreferences.analyticsConsent.enabled,
                        },
                        {
                          key: "disabled",
                          count:
                            stats.accountPreferences.analyticsConsent.disabled,
                        },
                        {
                          key: "unset",
                          count:
                            stats.accountPreferences.analyticsConsent.unset,
                        },
                      ]}
                      title="Analytics cookies"
                      totalUsers={stats.overview.totalUsers}
                    />
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
                    <AdminPreferenceBreakdownPanel
                      labelForKey={(key) =>
                        DEFAULT_SIDE_PANEL_LABELS[key] ?? key
                      }
                      rows={stats.accountPreferences.defaultSidePanels}
                      title="Default collection side panel"
                      totalUsers={stats.overview.totalUsers}
                    />
                  </div>

                  <article className={styles.panelCard}>
                    <p className={styles.panelEyebrow}>Pages opened</p>
                    <p className={styles.panelMeta}>
                      Opted-in visitors only. Each count is a page load, not a
                      person.
                    </p>
                    {renderFeatureUsageTable(
                      stats.featureUsage.pageViews,
                      "Page",
                    )}
                  </article>
                </div>
              </DashboardSection>

              <AdminUserLookupPanel />

              <AdminYoutubeEmbedTestPanel />
            </div>
          )}
        </div>
      </CollectionPlaybackPageShell>
    </Page>
  );
}
