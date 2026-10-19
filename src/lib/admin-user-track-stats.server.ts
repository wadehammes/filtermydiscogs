import { prisma } from "src/lib/db";
import type {
  AdminStatsGrowthDataPoint,
  AdminStatsTopUser,
  AdminStatsTopUserTrack,
  AdminStatsUserTrackOverview,
  AdminStatsUserTrackPlaybackWindow,
  FetchAdminUserTrackStatsResult,
} from "src/types/dashboard.types";

type UserTrackOverviewRow = {
  total_track_rows: number;
  users_with_tracks: number;
  total_plays: number;
  total_listens: number;
  tracks_with_overrides: number;
  users_with_overrides: number;
  new_rows_7d: number;
  new_rows_30d: number;
  active_users_7d: number;
  active_users_30d: number;
};

const mapPlaybackWindow = (
  overview: UserTrackOverviewRow,
  window: "7d" | "30d",
): AdminStatsUserTrackPlaybackWindow => ({
  newUserTracks: overview[`new_rows_${window}`],
  activePlaybackUsers: overview[`active_users_${window}`],
});

export const fetchAdminUserTrackStats = async ({
  sevenDaysAgo,
  thirtyDaysAgo,
}: {
  sevenDaysAgo: Date;
  thirtyDaysAgo: Date;
}): Promise<FetchAdminUserTrackStatsResult> => {
  const [
    overviewRows,
    growthRows,
    topUsersByPlays,
    topUsersByListens,
    topTracksByPlays,
    topTracksByListens,
  ] = await Promise.all([
    prisma.$queryRaw<UserTrackOverviewRow[]>`
      SELECT
        COUNT(*)::int AS total_track_rows,
        COUNT(DISTINCT user_id)::int AS users_with_tracks,
        COALESCE(SUM(play_count), 0)::int AS total_plays,
        COALESCE(SUM(listen_count), 0)::int AS total_listens,
        COUNT(*) FILTER (
          WHERE youtube_id IS NOT NULL AND btrim(youtube_id) <> ''
        )::int AS tracks_with_overrides,
        COUNT(DISTINCT user_id) FILTER (
          WHERE youtube_id IS NOT NULL AND btrim(youtube_id) <> ''
        )::int AS users_with_overrides,
        COUNT(*) FILTER (WHERE first_played_at >= ${sevenDaysAgo})::int AS new_rows_7d,
        COUNT(*) FILTER (WHERE first_played_at >= ${thirtyDaysAgo})::int AS new_rows_30d,
        COUNT(DISTINCT user_id) FILTER (
          WHERE last_played_at >= ${sevenDaysAgo}
            OR last_listened_at >= ${sevenDaysAgo}
        )::int AS active_users_7d,
        COUNT(DISTINCT user_id) FILTER (
          WHERE last_played_at >= ${thirtyDaysAgo}
            OR last_listened_at >= ${thirtyDaysAgo}
        )::int AS active_users_30d
      FROM user_tracks
    `,
    prisma.$queryRaw<AdminStatsGrowthDataPoint[]>`
      SELECT
        to_char(date_trunc('month', first_played_at), 'YYYY-MM') AS month,
        COUNT(*)::int AS count
      FROM user_tracks
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.$queryRaw<AdminStatsTopUser[]>`
      SELECT
        ut.user_id,
        u.username,
        SUM(ut.play_count)::int AS count
      FROM user_tracks ut
      INNER JOIN users u ON u.discogs_user_id = ut.user_id
      GROUP BY ut.user_id, u.username
      HAVING SUM(ut.play_count) > 0
      ORDER BY count DESC, u.username ASC
      LIMIT 10
    `,
    prisma.$queryRaw<AdminStatsTopUser[]>`
      SELECT
        ut.user_id,
        u.username,
        SUM(ut.listen_count)::int AS count
      FROM user_tracks ut
      INNER JOIN users u ON u.discogs_user_id = ut.user_id
      GROUP BY ut.user_id, u.username
      HAVING SUM(ut.listen_count) > 0
      ORDER BY count DESC, u.username ASC
      LIMIT 10
    `,
    prisma.$queryRaw<AdminStatsTopUserTrack[]>`
      SELECT
        ut.user_id,
        u.username,
        ut.track_key,
        ut.track_title,
        ut.artist,
        ut.release_title,
        ut.play_count::int AS count
      FROM user_tracks ut
      INNER JOIN users u ON u.discogs_user_id = ut.user_id
      WHERE ut.play_count > 0
      ORDER BY ut.play_count DESC, ut.last_played_at DESC NULLS LAST
      LIMIT 10
    `,
    prisma.$queryRaw<AdminStatsTopUserTrack[]>`
      SELECT
        ut.user_id,
        u.username,
        ut.track_key,
        ut.track_title,
        ut.artist,
        ut.release_title,
        ut.listen_count::int AS count
      FROM user_tracks ut
      INNER JOIN users u ON u.discogs_user_id = ut.user_id
      WHERE ut.listen_count > 0
      ORDER BY ut.listen_count DESC, ut.last_listened_at DESC NULLS LAST
      LIMIT 10
    `,
  ]);

  const overviewRow = overviewRows[0];

  if (!overviewRow) {
    throw new Error("Failed to load admin UserTrack overview stats");
  }

  const overview: AdminStatsUserTrackOverview = {
    totalTrackRows: overviewRow.total_track_rows,
    usersWithTracks: overviewRow.users_with_tracks,
    totalPlays: overviewRow.total_plays,
    totalListens: overviewRow.total_listens,
    tracksWithOverrides: overviewRow.tracks_with_overrides,
    usersWithOverrides: overviewRow.users_with_overrides,
  };

  return {
    userTracks: {
      overview,
      growth: growthRows,
      topUsers: {
        byPlays: topUsersByPlays,
        byListens: topUsersByListens,
      },
      topTracks: {
        byPlays: topTracksByPlays,
        byListens: topTracksByListens,
      },
    },
    playbackActivity: {
      last7Days: mapPlaybackWindow(overviewRow, "7d"),
      last30Days: mapPlaybackWindow(overviewRow, "30d"),
    },
  };
};
