import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { userTrackRecordBodyFactory } from "src/tests/factories/UserTrackRecordBody.factory";

jest.mock("src/lib/db", () => ({
  prisma: {
    userTrack: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    crateRelease: {
      findMany: jest.fn(),
    },
  },
}));

type DbModule = typeof import("src/lib/db");

let recordUserTrackEvent: typeof import("src/lib/user-track.server")["recordUserTrackEvent"];
let fetchUserTrackStats: typeof import("src/lib/user-track.server")["fetchUserTrackStats"];
let fetchTopUserTracks: typeof import("src/lib/user-track.server")["fetchTopUserTracks"];
let mockUpsert: jest.MockedFunction<DbModule["prisma"]["userTrack"]["upsert"]>;
let mockFindMany: jest.MockedFunction<
  DbModule["prisma"]["userTrack"]["findMany"]
>;
let mockCrateReleaseFindMany: jest.MockedFunction<
  DbModule["prisma"]["crateRelease"]["findMany"]
>;

const USER_ID = 7;

beforeEach(async () => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-09-18T12:00:00.000Z"));

  const [serverModule, db] = await Promise.all([
    import("src/lib/user-track.server"),
    import("src/lib/db"),
  ]);

  recordUserTrackEvent = serverModule.recordUserTrackEvent;
  fetchUserTrackStats = serverModule.fetchUserTrackStats;
  fetchTopUserTracks = serverModule.fetchTopUserTracks;
  mockUpsert = jest.mocked(db.prisma.userTrack.upsert);
  mockFindMany = jest.mocked(db.prisma.userTrack.findMany);
  mockCrateReleaseFindMany = jest.mocked(db.prisma.crateRelease.findMany);
  mockCrateReleaseFindMany.mockResolvedValue([]);
});

describe("recordUserTrackEvent", () => {
  it("upserts play event with increment and last_played_at", async () => {
    const body = userTrackRecordBodyFactory.play();

    await recordUserTrackEvent(USER_ID, body);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          user_id_track_key: {
            user_id: USER_ID,
            track_key: body.track_key,
          },
        },
        update: expect.objectContaining({
          play_count: { increment: 1 },
          last_played_at: new Date("2026-09-18T12:00:00.000Z"),
        }),
        create: expect.objectContaining({
          play_count: 1,
          listen_count: 0,
        }),
      }),
    );
  });

  it("upserts listen event with increment and last_listened_at", async () => {
    const body = userTrackRecordBodyFactory.listen();

    await recordUserTrackEvent(USER_ID, body);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          listen_count: { increment: 1 },
          last_listened_at: new Date("2026-09-18T12:00:00.000Z"),
        }),
        create: expect.objectContaining({
          play_count: 0,
          listen_count: 1,
        }),
      }),
    );
  });
});

describe("fetchUserTrackStats", () => {
  it("returns zeroed stats for missing keys and merges found rows", async () => {
    mockFindMany.mockResolvedValue([
      {
        track_key: "1:A",
        play_count: 3,
        listen_count: 2,
      },
    ] as Awaited<ReturnType<DbModule["prisma"]["userTrack"]["findMany"]>>);

    const stats = await fetchUserTrackStats(USER_ID, ["1:A", "1:B"]);

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { user_id: USER_ID, track_key: { in: ["1:A", "1:B"] } },
      select: {
        track_key: true,
        play_count: true,
        listen_count: true,
      },
    });
    expect(stats).toEqual({
      "1:A": { play_count: 3, listen_count: 2 },
      "1:B": { play_count: 0, listen_count: 0 },
    });
  });

  it("returns empty object when no keys requested", async () => {
    await expect(fetchUserTrackStats(USER_ID, [])).resolves.toEqual({});
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});

describe("fetchTopUserTracks", () => {
  it("queries play and listen leaderboards with the shared limit", async () => {
    mockFindMany
      .mockResolvedValueOnce([
        {
          track_key: "1:A1",
          instance_id: "1",
          track_title: "Play leader",
          track_position: "A1",
          artist: "Artist",
          release_title: "Album",
          play_count: 9,
          listen_count: 1,
        },
      ] as Awaited<ReturnType<DbModule["prisma"]["userTrack"]["findMany"]>>)
      .mockResolvedValueOnce(
        [] as Awaited<ReturnType<DbModule["prisma"]["userTrack"]["findMany"]>>,
      );

    const result = await fetchTopUserTracks(USER_ID, 5);

    expect(mockFindMany).toHaveBeenCalledTimes(2);
    expect(mockFindMany).toHaveBeenNthCalledWith(1, {
      where: { user_id: USER_ID, play_count: { gt: 0 } },
      orderBy: [{ play_count: "desc" }, { last_played_at: "desc" }],
      take: 5,
      select: expect.objectContaining({ track_key: true, play_count: true }),
    });
    expect(mockFindMany).toHaveBeenNthCalledWith(2, {
      where: { user_id: USER_ID, listen_count: { gt: 0 } },
      orderBy: [{ listen_count: "desc" }, { last_listened_at: "desc" }],
      take: 5,
      select: expect.objectContaining({ listen_count: true }),
    });
    expect(result.most_played[0]?.track_title).toBe("Play leader");
    expect(result.most_played[0]?.release_thumb).toBeNull();
    expect(result.most_listened).toEqual([]);
    expect(mockCrateReleaseFindMany).toHaveBeenCalledTimes(1);
  });
});
