import { faker } from "@faker-js/faker";
import { adminStatsTopUserFactory } from "src/tests/factories/AdminStatsTopUser.factory";
import { adminStatsTopUserTrackFactory } from "src/tests/factories/AdminStatsTopUserTrack.factory";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type {
  AdminStatsGrowthDataPoint,
  AdminStatsUserTrackOverview,
  FetchAdminUserTrackStatsResult,
} from "src/types/dashboard.types";
import type { KeysMatch } from "src/types/KeysMatch";

type FetchAdminUserTrackStatsResultFactoryOptions = Record<string, never>;

export type AdminUserTrackOverviewSqlRow = {
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

export type AdminUserTrackStatsMappingFixture = {
  queryRawResponses: [
    AdminUserTrackOverviewSqlRow[],
    AdminStatsGrowthDataPoint[],
    ReturnType<typeof adminStatsTopUserFactory.build>[],
    ReturnType<typeof adminStatsTopUserFactory.build>[],
    ReturnType<typeof adminStatsTopUserTrackFactory.build>[],
    ReturnType<typeof adminStatsTopUserTrackFactory.build>[],
  ];
  result: FetchAdminUserTrackStatsResult;
};

class FetchAdminUserTrackStatsResultFactory extends BaseFactory<
  FetchAdminUserTrackStatsResult,
  FetchAdminUserTrackStatsResultFactoryOptions
> {
  build(
    attributes?: Partial<FetchAdminUserTrackStatsResult>,
    _options?: FetchAdminUserTrackStatsResultFactoryOptions,
  ): FetchAdminUserTrackStatsResult {
    const overview: AdminStatsUserTrackOverview = {
      totalTrackRows: faker.number.int({ min: 0, max: 500 }),
      usersWithTracks: faker.number.int({ min: 0, max: 200 }),
      totalPlays: faker.number.int({ min: 0, max: 5000 }),
      totalListens: faker.number.int({ min: 0, max: 3000 }),
      tracksWithOverrides: faker.number.int({ min: 0, max: 100 }),
      usersWithOverrides: faker.number.int({ min: 0, max: 80 }),
    };

    const instance = {
      userTracks: {
        overview,
        growth: [
          {
            month: "2026-09",
            count: faker.number.int({ min: 1, max: 100 }),
          },
        ],
        topUsers: {
          byPlays: [adminStatsTopUserFactory.build()],
          byListens: [adminStatsTopUserFactory.build()],
        },
        topTracks: {
          byPlays: [adminStatsTopUserTrackFactory.build()],
          byListens: [adminStatsTopUserTrackFactory.build()],
        },
      },
      playbackActivity: {
        last7Days: {
          newUserTracks: faker.number.int({ min: 0, max: 50 }),
          activePlaybackUsers: faker.number.int({ min: 0, max: 50 }),
        },
        last30Days: {
          newUserTracks: faker.number.int({ min: 0, max: 150 }),
          activePlaybackUsers: faker.number.int({ min: 0, max: 100 }),
        },
      },
    } satisfies FetchAdminUserTrackStatsResult;

    const factoryBuilt: FetchAdminUserTrackStatsResult = {
      ...instance,
      ...(attributes ?? {}),
      userTracks: {
        ...instance.userTracks,
        ...(attributes?.userTracks ?? {}),
      },
      playbackActivity: {
        ...instance.playbackActivity,
        ...(attributes?.playbackActivity ?? {}),
      },
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      FetchAdminUserTrackStatsResult,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  mappingFixture(): AdminUserTrackStatsMappingFixture {
    const result = this.build({
      userTracks: {
        overview: {
          totalTrackRows: 120,
          usersWithTracks: 40,
          totalPlays: 900,
          totalListens: 450,
          tracksWithOverrides: 12,
          usersWithOverrides: 8,
        },
        growth: [
          { month: "2026-09", count: 30 },
          { month: "2026-10", count: 20 },
        ],
        topUsers: {
          byPlays: [
            adminStatsTopUserFactory.build({
              user_id: 1,
              username: "alpha",
              count: 100,
            }),
          ],
          byListens: [
            adminStatsTopUserFactory.build({
              user_id: 2,
              username: "beta",
              count: 80,
            }),
          ],
        },
        topTracks: {
          byPlays: [
            adminStatsTopUserTrackFactory.build({
              user_id: 1,
              username: "alpha",
              track_key: "inst:1",
              track_title: "Track A",
              artist: "Artist",
              release_title: "Album",
              count: 12,
            }),
          ],
          byListens: [
            adminStatsTopUserTrackFactory.build({
              user_id: 2,
              username: "beta",
              track_key: "inst:2",
              track_title: "Track B",
              artist: null,
              release_title: null,
              count: 9,
            }),
          ],
        },
      },
      playbackActivity: {
        last7Days: {
          newUserTracks: 15,
          activePlaybackUsers: 10,
        },
        last30Days: {
          newUserTracks: 55,
          activePlaybackUsers: 25,
        },
      },
    });

    const overviewSql: AdminUserTrackOverviewSqlRow = {
      total_track_rows: result.userTracks.overview.totalTrackRows,
      users_with_tracks: result.userTracks.overview.usersWithTracks,
      total_plays: result.userTracks.overview.totalPlays,
      total_listens: result.userTracks.overview.totalListens,
      tracks_with_overrides: result.userTracks.overview.tracksWithOverrides,
      users_with_overrides: result.userTracks.overview.usersWithOverrides,
      new_rows_7d: result.playbackActivity.last7Days.newUserTracks,
      new_rows_30d: result.playbackActivity.last30Days.newUserTracks,
      active_users_7d: result.playbackActivity.last7Days.activePlaybackUsers,
      active_users_30d: result.playbackActivity.last30Days.activePlaybackUsers,
    };

    return {
      queryRawResponses: [
        [overviewSql],
        result.userTracks.growth,
        result.userTracks.topUsers.byPlays,
        result.userTracks.topUsers.byListens,
        result.userTracks.topTracks.byPlays,
        result.userTracks.topTracks.byListens,
      ],
      result,
    };
  }
}

export const fetchAdminUserTrackStatsResultFactory =
  new FetchAdminUserTrackStatsResultFactory();
