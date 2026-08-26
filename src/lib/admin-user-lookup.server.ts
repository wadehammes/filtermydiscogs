import { and } from "@prisma/orm-postgres/orm-client";
import {
  countRows,
  db,
  type JsonValue,
  orm,
  ormTimestamp,
  queryRawRows,
} from "src/lib/db";
import { parseUserPreferences } from "src/lib/user-preferences.server";
import type { AdminUserLookupStats } from "src/types/adminUserLookup.types";
import { addUtcDays, startOfUtcDay } from "src/utils/dateHelpers";

const toIsoFromOrm = (value: unknown): string =>
  new Date(value as string | Date).toISOString();

const toIsoString = (value: unknown | null | undefined): string | null =>
  value ? toIsoFromOrm(value) : null;

const formatAnalyticsConsent = (
  value: boolean | undefined,
): AdminUserLookupStats["preferences"]["analyticsConsent"] => {
  if (value === true) {
    return "enabled";
  }

  if (value === false) {
    return "disabled";
  }

  return "unset";
};

type AdminUserLookupRow = {
  discogs_user_id: number;
  username: string;
  preferences: unknown;
  created_at: Date;
  updated_at: Date;
};

export const getAdminUserLookup = async (
  username: string,
): Promise<AdminUserLookupStats | null> => {
  const normalizedUsername = username.trim();

  if (normalizedUsername.length === 0) {
    return null;
  }

  const userRows = await queryRawRows<AdminUserLookupRow>(
    db.raw.sql`
      SELECT discogs_user_id, username, preferences, created_at, updated_at
      FROM users
      WHERE LOWER(username) = LOWER(${normalizedUsername})
      LIMIT 1
    `
      .returnsRow({
        discogs_user_id: "pg/int4@1",
        username: "pg/text@1",
        preferences: "pg/jsonb@1",
        created_at: "pg/timestamp-string@1",
        updated_at: "pg/timestamp-string@1",
      })
      .build(),
  );

  const user = userRows[0];

  if (!user) {
    return null;
  }

  const userId = user.discogs_user_id;
  const now = startOfUtcDay(new Date());
  const sevenDaysAgo = addUtcDays(now, -7);
  const thirtyDaysAgo = addUtcDays(now, -30);
  const preferences = parseUserPreferences(user.preferences as JsonValue);

  const [
    totalCrates,
    publicCrates,
    packedEnabledCrates,
    cratesWithNotes,
    totalReleases,
    packedReleases,
    setMarkers,
    releasesAddedLast7Days,
    releasesAddedLast30Days,
    analyticsLast7Days,
    analyticsLast30Days,
    analyticsTotal,
    lastCrateUpdate,
    lastReleaseAdded,
    crates,
  ] = await Promise.all([
    countRows(orm.Crates.where({ userId })),
    countRows(orm.Crates.where({ userId, private: false })),
    countRows(orm.Crates.where({ userId, packedEnabled: true })),
    countRows(
      orm.Crates.where({ userId }).where((crate) =>
        and(crate.notes.isNotNull(), crate.notes.neq("")),
      ),
    ),
    countRows(orm.CrateReleases.where({ userId })),
    countRows(
      orm.CrateReleases.where({ userId }).where((release) =>
        release.foundAt.isNotNull(),
      ),
    ),
    countRows(orm.CrateSetMarkers.where({ userId })),
    countRows(
      orm.CrateReleases.where({ userId }).where((release) =>
        release.addedAt.gte(ormTimestamp(sevenDaysAgo)),
      ),
    ),
    countRows(
      orm.CrateReleases.where({ userId }).where((release) =>
        release.addedAt.gte(ormTimestamp(thirtyDaysAgo)),
      ),
    ),
    countRows(
      orm.ProductAnalyticsEvents.where({ userId }).where((event) =>
        event.createdAt.gte(ormTimestamp(sevenDaysAgo)),
      ),
    ),
    countRows(
      orm.ProductAnalyticsEvents.where({ userId }).where((event) =>
        event.createdAt.gte(ormTimestamp(thirtyDaysAgo)),
      ),
    ),
    countRows(orm.ProductAnalyticsEvents.where({ userId })),
    orm.Crates.where({ userId }).aggregate((aggregate) => ({
      updatedAt: aggregate.max("updatedAt"),
    })),
    orm.CrateReleases.where({ userId }).aggregate((aggregate) => ({
      addedAt: aggregate.max("addedAt"),
    })),
    orm.Crates.where({ userId })
      .include("crateReleases", (releases) => releases.count())
      .include("crateSetMarkers", (markers) => markers.count())
      .orderBy((crate) => crate.updatedAt.desc())
      .limit(25)
      .all(),
  ]);

  return {
    user: {
      discogsUserId: user.discogs_user_id,
      username: user.username,
      createdAt: user.created_at.toISOString(),
      updatedAt: user.updated_at.toISOString(),
    },
    preferences: {
      theme: preferences.theme,
      defaultView: preferences.view.currentView,
      persistFilters: preferences.persistFilters,
      analyticsConsent: formatAnalyticsConsent(preferences.analyticsConsent),
      savedViewsCount: preferences.filterViews.length,
    },
    totals: {
      crates: totalCrates,
      releases: totalReleases,
      publicCrates,
      packedEnabledCrates,
      cratesWithNotes,
      setMarkers,
      packedReleases,
    },
    activity: {
      lastCrateUpdateAt: toIsoString(lastCrateUpdate.updatedAt),
      lastReleaseAddedAt: toIsoString(lastReleaseAdded.addedAt),
      releasesAddedLast7Days,
      releasesAddedLast30Days,
    },
    analytics: {
      last7Days: analyticsLast7Days,
      last30Days: analyticsLast30Days,
      total: analyticsTotal,
    },
    crates: crates.map((crate) => ({
      id: crate.id,
      name: crate.name,
      releaseCount: crate.crateReleases,
      markerCount: crate.crateSetMarkers,
      private: crate.private,
      packedEnabled: crate.packedEnabled,
      hasNotes: Boolean(crate.notes && crate.notes.trim().length > 0),
      createdAt: toIsoFromOrm(crate.createdAt),
      updatedAt: toIsoFromOrm(crate.updatedAt),
    })),
  };
};
