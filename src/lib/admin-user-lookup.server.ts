import { prisma } from "src/lib/db";
import { parseUserPreferences } from "src/lib/user-preferences.server";
import type { AdminUserLookupStats } from "src/types/adminUserLookup.types";
import { addUtcDays, startOfUtcDay } from "src/utils/dateHelpers";

const toIsoString = (value: Date | null | undefined): string | null =>
  value ? value.toISOString() : null;

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

export const getAdminUserLookup = async (
  username: string,
): Promise<AdminUserLookupStats | null> => {
  const normalizedUsername = username.trim();

  if (normalizedUsername.length === 0) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      username: {
        equals: normalizedUsername,
        mode: "insensitive",
      },
    },
    select: {
      discogs_user_id: true,
      username: true,
      preferences: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!user) {
    return null;
  }

  const userId = user.discogs_user_id;
  const now = startOfUtcDay(new Date());
  const sevenDaysAgo = addUtcDays(now, -7);
  const thirtyDaysAgo = addUtcDays(now, -30);
  const preferences = parseUserPreferences(user.preferences);

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
    prisma.crate.count({ where: { user_id: userId } }),
    prisma.crate.count({ where: { user_id: userId, private: false } }),
    prisma.crate.count({ where: { user_id: userId, packed_enabled: true } }),
    prisma.crate.count({
      where: {
        user_id: userId,
        AND: [{ notes: { not: null } }, { notes: { not: "" } }],
      },
    }),
    prisma.crateRelease.count({ where: { user_id: userId } }),
    prisma.crateRelease.count({
      where: { user_id: userId, found_at: { not: null } },
    }),
    prisma.crateSetMarker.count({ where: { user_id: userId } }),
    prisma.crateRelease.count({
      where: { user_id: userId, added_at: { gte: sevenDaysAgo } },
    }),
    prisma.crateRelease.count({
      where: { user_id: userId, added_at: { gte: thirtyDaysAgo } },
    }),
    prisma.productAnalyticsEvent.count({
      where: { user_id: userId, created_at: { gte: sevenDaysAgo } },
    }),
    prisma.productAnalyticsEvent.count({
      where: { user_id: userId, created_at: { gte: thirtyDaysAgo } },
    }),
    prisma.productAnalyticsEvent.count({ where: { user_id: userId } }),
    prisma.crate.aggregate({
      where: { user_id: userId },
      _max: { updated_at: true },
    }),
    prisma.crateRelease.aggregate({
      where: { user_id: userId },
      _max: { added_at: true },
    }),
    prisma.crate.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        name: true,
        private: true,
        packed_enabled: true,
        notes: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            releases: true,
            markers: true,
          },
        },
      },
      orderBy: { updated_at: "desc" },
      take: 25,
    }),
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
      lastCrateUpdateAt: toIsoString(lastCrateUpdate._max.updated_at),
      lastReleaseAddedAt: toIsoString(lastReleaseAdded._max.added_at),
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
      releaseCount: crate._count.releases,
      markerCount: crate._count.markers,
      private: crate.private,
      packedEnabled: crate.packed_enabled,
      hasNotes: Boolean(crate.notes && crate.notes.trim().length > 0),
      createdAt: crate.created_at.toISOString(),
      updatedAt: crate.updated_at.toISOString(),
    })),
  };
};
