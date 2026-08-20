"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import dashboardStyles from "src/components/AdminDashboard/AdminDashboardClient.module.css";
import { DashboardSection } from "src/components/Dashboard/DashboardSection.component";
import { StatCard } from "src/components/StatCard/StatCard.component";
import { StatsGrid } from "src/components/StatsGrid/StatsGrid.component";
import { useAdminUserLookupQuery } from "src/hooks/queries/useAdminUserLookupQuery";
import { formatCommunityStatValue } from "src/lib/formatCommunityStatValue";
import {
  type AdminUserLookupFormValues,
  adminUserLookupFormSchema,
} from "src/lib/validation/adminUserLookup.schemas";
import { THEME_LABELS } from "src/utils/themeAppearance";
import styles from "./AdminUserLookupPanel.module.css";

const DEFAULT_VIEW_LABELS: Record<string, string> = {
  card: "Grid",
  list: "Table",
  random: "Random",
};

const ANALYTICS_CONSENT_LABELS = {
  enabled: "Enabled",
  disabled: "Disabled",
  unset: "Unset",
} as const;

const getDiscogsUserProfileUrl = (username: string): string =>
  `https://www.discogs.com/user/${encodeURIComponent(username)}`;

const formatTimestamp = (value: string | null): string => {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const renderPreferenceRow = (label: string, value: ReactNode) => (
  <div className={dashboardStyles.activityRow}>
    <dt className={dashboardStyles.activityLabel}>{label}</dt>
    <dd className={dashboardStyles.activityValue}>{value}</dd>
  </div>
);

export const AdminUserLookupPanel = () => {
  const [lookupUsername, setLookupUsername] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminUserLookupFormValues>({
    resolver: zodResolver(adminUserLookupFormSchema),
    defaultValues: { username: "" },
  });

  const { data, error, isFetching } = useAdminUserLookupQuery(lookupUsername);

  const onSubmit = handleSubmit(({ username }) => {
    setLookupUsername(username.trim());
  });

  return (
    <DashboardSection
      id="user-lookup"
      lede="Look up a Discogs username to inspect account stats, preferences, and crates."
      title="User lookup"
    >
      <article className={styles.panel}>
        <form className={styles.lookupForm} onSubmit={onSubmit}>
          <label className={styles.lookupLabel} htmlFor="admin-user-lookup">
            Discogs username
          </label>
          <div className={styles.lookupControls}>
            <input
              {...register("username")}
              autoComplete="off"
              className={styles.lookupInput}
              id="admin-user-lookup"
              placeholder="Paste a username"
              spellCheck={false}
            />
            <button
              className={styles.lookupButton}
              disabled={isFetching}
              type="submit"
            >
              {isFetching ? "Looking up..." : "Look up"}
            </button>
          </div>
          {errors.username && (
            <p className={styles.lookupError}>{errors.username.message}</p>
          )}
        </form>

        {error && lookupUsername && (
          <p className={styles.lookupError}>
            {error instanceof Error ? error.message : "Failed to look up user"}
          </p>
        )}

        {data && (
          <div className={styles.results}>
            <article className={dashboardStyles.panelCard}>
              <p className={dashboardStyles.panelEyebrow}>Account</p>
              <dl className={dashboardStyles.activityList}>
                {renderPreferenceRow(
                  "Username",
                  <a
                    className={dashboardStyles.tableUserLink}
                    href={getDiscogsUserProfileUrl(data.user.username)}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {data.user.username}
                  </a>,
                )}
                {renderPreferenceRow(
                  "Discogs user ID",
                  data.user.discogsUserId,
                )}
                {renderPreferenceRow(
                  "Signed up",
                  formatTimestamp(data.user.createdAt),
                )}
                {renderPreferenceRow(
                  "Last account update",
                  formatTimestamp(data.user.updatedAt),
                )}
              </dl>
            </article>

            <StatsGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }}>
              <StatCard
                label="Crates"
                value={formatCommunityStatValue(data.totals.crates)}
              />
              <StatCard
                label="Saved releases"
                value={formatCommunityStatValue(data.totals.releases)}
              />
              <StatCard
                label="Public crates"
                value={formatCommunityStatValue(data.totals.publicCrates)}
              />
              <StatCard
                label="Set markers"
                value={formatCommunityStatValue(data.totals.setMarkers)}
              />
              <StatCard
                label="Gig packing enabled"
                value={formatCommunityStatValue(
                  data.totals.packedEnabledCrates,
                )}
              />
              <StatCard
                label="Crates with notes"
                value={formatCommunityStatValue(data.totals.cratesWithNotes)}
              />
              <StatCard
                label="Packed albums"
                value={formatCommunityStatValue(data.totals.packedReleases)}
              />
              <StatCard
                label="Releases added (7d)"
                value={formatCommunityStatValue(
                  data.activity.releasesAddedLast7Days,
                )}
              />
            </StatsGrid>

            <div className={dashboardStyles.cardGrid}>
              <article className={dashboardStyles.panelCard}>
                <p className={dashboardStyles.panelEyebrow}>Preferences</p>
                <dl className={dashboardStyles.activityList}>
                  {renderPreferenceRow(
                    "Theme",
                    THEME_LABELS[
                      data.preferences.theme as keyof typeof THEME_LABELS
                    ] ?? data.preferences.theme,
                  )}
                  {renderPreferenceRow(
                    "Default view",
                    DEFAULT_VIEW_LABELS[data.preferences.defaultView] ??
                      data.preferences.defaultView,
                  )}
                  {renderPreferenceRow(
                    "Remember filters",
                    data.preferences.persistFilters ? "On" : "Off",
                  )}
                  {renderPreferenceRow(
                    "Analytics cookies",
                    ANALYTICS_CONSENT_LABELS[data.preferences.analyticsConsent],
                  )}
                </dl>
              </article>

              <article className={dashboardStyles.panelCard}>
                <p className={dashboardStyles.panelEyebrow}>Activity</p>
                <dl className={dashboardStyles.activityList}>
                  {renderPreferenceRow(
                    "Last crate update",
                    formatTimestamp(data.activity.lastCrateUpdateAt),
                  )}
                  {renderPreferenceRow(
                    "Last release added",
                    formatTimestamp(data.activity.lastReleaseAddedAt),
                  )}
                  {renderPreferenceRow(
                    "Releases added (30d)",
                    formatCommunityStatValue(
                      data.activity.releasesAddedLast30Days,
                    ),
                  )}
                  {renderPreferenceRow(
                    "Analytics events (7d)",
                    formatCommunityStatValue(data.analytics.last7Days),
                  )}
                  {renderPreferenceRow(
                    "Analytics events (30d)",
                    formatCommunityStatValue(data.analytics.last30Days),
                  )}
                  {renderPreferenceRow(
                    "Analytics events (total)",
                    formatCommunityStatValue(data.analytics.total),
                  )}
                </dl>
              </article>
            </div>

            <article className={dashboardStyles.panelCard}>
              <p className={dashboardStyles.panelEyebrow}>Crates</p>
              <div className={styles.cratesTableContainer}>
                <table className={styles.cratesTable}>
                  <thead>
                    <tr>
                      <th scope="col">Crate</th>
                      <th className={styles.cratesMetricCol} scope="col">
                        Releases
                      </th>
                      <th className={styles.cratesMetricCol} scope="col">
                        Markers
                      </th>
                      <th scope="col">Flags</th>
                      <th scope="col">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.crates.length === 0 ? (
                      <tr>
                        <td className={styles.cratesEmpty} colSpan={5}>
                          No crates yet
                        </td>
                      </tr>
                    ) : (
                      data.crates.map((crate) => {
                        const flags = [
                          crate.private ? "Private" : "Public",
                          crate.packedEnabled ? "Packing" : null,
                          crate.hasNotes ? "Notes" : null,
                        ].filter(Boolean);

                        return (
                          <tr key={crate.id}>
                            <td>{crate.name}</td>
                            <td className={styles.cratesMetricCol}>
                              {formatCommunityStatValue(crate.releaseCount)}
                            </td>
                            <td className={styles.cratesMetricCol}>
                              {formatCommunityStatValue(crate.markerCount)}
                            </td>
                            <td>{flags.join(" · ")}</td>
                            <td>{formatTimestamp(crate.updatedAt)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        )}
      </article>
    </DashboardSection>
  );
};
