import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { userTrackRecordBodyFactory } from "src/tests/factories/UserTrackRecordBody.factory";
import { createDbModuleMock } from "src/tests/mocks/mockDb";

const dbMock = createDbModuleMock();

jest.mock("src/lib/db", () => dbMock);

let recordUserTrackEvent: typeof import("src/lib/user-track.server")["recordUserTrackEvent"];
let saveUserTrackYoutubeOverride: typeof import("src/lib/user-track.server")["saveUserTrackYoutubeOverride"];
let fetchUserTrackStats: typeof import("src/lib/user-track.server")["fetchUserTrackStats"];
let fetchTopUserTracks: typeof import("src/lib/user-track.server")["fetchTopUserTracks"];
let mockUserTracksFirst: typeof dbMock.orm.UserTracks.first;
let mockUserTracksCreate: typeof dbMock.orm.UserTracks.create;
let mockUserTracksUpdate: typeof dbMock.orm.UserTracks.update;
let mockUserTracksAll: typeof dbMock.orm.UserTracks.all;
let mockUserTracksUpsert: typeof dbMock.orm.UserTracks.upsert;
let mockCrateReleasesAll: typeof dbMock.orm.CrateReleases.all;

const USER_ID = 7;

beforeEach(async () => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-09-18T12:00:00.000Z"));

  const serverModule = await import("src/lib/user-track.server");

  recordUserTrackEvent = serverModule.recordUserTrackEvent;
  saveUserTrackYoutubeOverride = serverModule.saveUserTrackYoutubeOverride;
  fetchUserTrackStats = serverModule.fetchUserTrackStats;
  fetchTopUserTracks = serverModule.fetchTopUserTracks;
  mockUserTracksFirst = dbMock.orm.UserTracks.first;
  mockUserTracksCreate = dbMock.orm.UserTracks.create;
  mockUserTracksUpdate = dbMock.orm.UserTracks.update;
  mockUserTracksAll = dbMock.orm.UserTracks.all;
  mockUserTracksUpsert = dbMock.orm.UserTracks.upsert;
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

describe("saveUserTrackYoutubeOverride", () => {
  it("creates a user_tracks row with zero play and listen counts when saving an override for a track without a Discogs embed", async () => {
    const body = {
      track_key: "modal-release-instance:A2",
      track_title: "Modal Track Two",
      track_position: "A2",
      instance_id: "modal-release-instance",
      youtube_id: "dQw4w9WgXcQ",
      artist: "Rick Astley",
      release_title: "Other Album",
    };

    await saveUserTrackYoutubeOverride(USER_ID, body);

    expect(mockUserTracksUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        conflictOn: {
          userId: USER_ID,
          trackKey: "modal-release-instance:A2",
        },
        create: expect.objectContaining({
          trackKey: "modal-release-instance:A2",
          trackPosition: "A2",
          playCount: 0,
          listenCount: 0,
          youtubeId: "dQw4w9WgXcQ",
        }),
      }),
    );
  });

  it("upserts metadata and youtube_id without incrementing play or listen counts", async () => {
    const body = {
      track_key: "1:A",
      track_title: "Track",
      track_position: "A",
      instance_id: "1",
      youtube_id: "dQw4w9WgXcQ",
    };

    await saveUserTrackYoutubeOverride(USER_ID, body);

    expect(mockUserTracksUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          youtubeId: "dQw4w9WgXcQ",
        }),
        create: expect.objectContaining({
          playCount: 0,
          listenCount: 0,
          youtubeId: "dQw4w9WgXcQ",
        }),
      }),
    );
    expect(mockUserTracksUpsert.mock.calls[0]?.[0]?.update).not.toHaveProperty(
      "playCount",
    );
  });

  it("clears youtube_id when override is removed", async () => {
    const body = {
      track_key: "1:A",
      track_title: "Track",
      track_position: "A",
      instance_id: "1",
      youtube_id: null,
    };

    await saveUserTrackYoutubeOverride(USER_ID, body);

    expect(mockUserTracksUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          youtubeId: null,
        }),
        create: expect.objectContaining({
          youtubeId: null,
        }),
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
        youtubeId: "dQw4w9WgXcQ",
      },
    ]);

    const stats = await fetchUserTrackStats(USER_ID, ["1:A", "1:B"]);

    expect(mockUserTracksAll).toHaveBeenCalled();
    expect(stats).toEqual({
      "1:A": { play_count: 3, listen_count: 2, youtube_id: "dQw4w9WgXcQ" },
      "1:B": { play_count: 0, listen_count: 0, youtube_id: null },
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
