import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createDbModuleMock } from "src/tests/mocks/mockDb";
import { userTrackRecordBodyFactory } from "src/tests/factories/UserTrackRecordBody.factory";

const dbMock = createDbModuleMock();

jest.mock("src/lib/db", () => dbMock);

let recordUserTrackEvent: typeof import("src/lib/user-track.server")["recordUserTrackEvent"];
let fetchUserTrackStats: typeof import("src/lib/user-track.server")["fetchUserTrackStats"];
let fetchTopUserTracks: typeof import("src/lib/user-track.server")["fetchTopUserTracks"];
let mockUserTracksFirst: typeof dbMock.orm.UserTracks.first;
let mockUserTracksCreate: typeof dbMock.orm.UserTracks.create;
let mockUserTracksUpdate: typeof dbMock.orm.UserTracks.update;
let mockUserTracksAll: typeof dbMock.orm.UserTracks.all;
let mockCrateReleasesAll: typeof dbMock.orm.CrateReleases.all;

const USER_ID = 7;

beforeEach(async () => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-09-18T12:00:00.000Z"));

  const serverModule = await import("src/lib/user-track.server");

  recordUserTrackEvent = serverModule.recordUserTrackEvent;
  fetchUserTrackStats = serverModule.fetchUserTrackStats;
  fetchTopUserTracks = serverModule.fetchTopUserTracks;
  mockUserTracksFirst = dbMock.orm.UserTracks.first;
  mockUserTracksCreate = dbMock.orm.UserTracks.create;
  mockUserTracksUpdate = dbMock.orm.UserTracks.update;
  mockUserTracksAll = dbMock.orm.UserTracks.all;
  mockCrateReleasesAll = dbMock.orm.CrateReleases.all;
  mockUserTracksFirst.mockResolvedValue(null);
  mockCrateReleasesAll.mockResolvedValue([]);
});

describe("recordUserTrackEvent", () => {
  it("upserts play event with increment and last_played_at", async () => {
    const body = userTrackRecordBodyFactory.play();
    mockUserTracksFirst.mockResolvedValueOnce({
      playCount: 2,
      listenCount: 0,
    });

    await recordUserTrackEvent(USER_ID, body);

    expect(mockUserTracksUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        playCount: 3,
        lastPlayedAt: "2026-09-18T12:00:00.000Z",
        trackTitle: body.track_title,
      }),
    );
  });

  it("creates play row when none exists", async () => {
    const body = userTrackRecordBodyFactory.play();

    await recordUserTrackEvent(USER_ID, body);

    expect(mockUserTracksCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
        trackKey: body.track_key,
        playCount: 1,
        listenCount: 0,
        lastPlayedAt: "2026-09-18T12:00:00.000Z",
      }),
    );
  });

  it("upserts listen event with increment and last_listened_at", async () => {
    const body = userTrackRecordBodyFactory.listen();
    mockUserTracksFirst.mockResolvedValueOnce({
      playCount: 1,
      listenCount: 4,
    });

    await recordUserTrackEvent(USER_ID, body);

    expect(mockUserTracksUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        listenCount: 5,
        lastListenedAt: "2026-09-18T12:00:00.000Z",
      }),
    );
  });
});

describe("fetchUserTrackStats", () => {
  it("returns zeroed stats for missing keys and merges found rows", async () => {
    mockUserTracksAll.mockResolvedValue([
      {
        trackKey: "1:A",
        playCount: 3,
        listenCount: 2,
      },
    ]);

    const stats = await fetchUserTrackStats(USER_ID, ["1:A", "1:B"]);

    expect(mockUserTracksAll).toHaveBeenCalled();
    expect(stats).toEqual({
      "1:A": { play_count: 3, listen_count: 2 },
      "1:B": { play_count: 0, listen_count: 0 },
    });
  });

  it("returns empty object when no keys requested", async () => {
    await expect(fetchUserTrackStats(USER_ID, [])).resolves.toEqual({});
    expect(mockUserTracksAll).not.toHaveBeenCalled();
  });
});

describe("fetchTopUserTracks", () => {
  it("queries play and listen leaderboards with the shared limit", async () => {
    mockUserTracksAll
      .mockResolvedValueOnce([
        {
          trackKey: "1:A1",
          instanceId: "1",
          trackTitle: "Play leader",
          trackPosition: "A1",
          artist: "Artist",
          releaseTitle: "Album",
          playCount: 9,
          listenCount: 1,
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await fetchTopUserTracks(USER_ID, 5);

    expect(mockUserTracksAll).toHaveBeenCalledTimes(2);
    expect(result.most_played).toHaveLength(1);
    expect(result.most_played[0]).toMatchObject({
      track_key: "1:A1",
      play_count: 9,
      release_thumb: null,
    });
    expect(result.most_listened).toEqual([]);
  });
});
