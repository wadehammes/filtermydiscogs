import { describe, expect, it } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createQueueItem } from "src/utils/playbackQueue";
import {
  buildTrackKey,
  buildUserTrackFieldsFromQueueItem,
  buildUserTrackFieldsFromRelease,
  buildYoutubeThumbnailUrl,
  formatTopUserTrackHeadLabel,
  formatUserTrackListenLabel,
  formatUserTrackListenTooltip,
  formatUserTrackStatsLabel,
  mapTrackStatsByPosition,
  mapUserYoutubeIdsByPosition,
  normalizeTrackStatsKeys,
  normalizeYoutubeVideoInput,
} from "src/utils/userTrack";

describe("userTrack utils", () => {
  it("buildTrackKey matches queue item key format", () => {
    expect(buildTrackKey("inst-1", "A1")).toBe("inst-1:A1");
  });

  it("buildUserTrackFieldsFromQueueItem includes metadata and optional youtube id", () => {
    const release = releaseFactory.withDisplayDefaults({
      instance_id: "42",
    });
    const item = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "Opening",
    });

    expect(buildUserTrackFieldsFromQueueItem(item, "dQw4w9WgXcQ")).toEqual({
      track_key: "42:A1",
      track_title: "Opening",
      track_position: "A1",
      instance_id: "42",
      youtube_id: "dQw4w9WgXcQ",
      artist: "Test Artist",
      release_title: "Test Album",
    });
  });

  it("formatTopUserTrackHeadLabel combines position and catalog title", () => {
    expect(
      formatTopUserTrackHeadLabel({
        track_position: "B2",
        track_title: "B2",
        catalogTrackTitle: "Labyrinth",
      }),
    ).toBe("B2 - Labyrinth");
  });

  it("formatUserTrackStatsLabel omits zero counts", () => {
    expect(formatUserTrackStatsLabel({ play_count: 2, listen_count: 0 })).toBe(
      "2 plays",
    );
    expect(formatUserTrackStatsLabel({ play_count: 0, listen_count: 0 })).toBe(
      null,
    );
  });

  it("formatUserTrackListenLabel shows listens only", () => {
    expect(formatUserTrackListenLabel({ play_count: 4, listen_count: 1 })).toBe(
      "1 listen",
    );
    expect(formatUserTrackListenLabel({ play_count: 0, listen_count: 0 })).toBe(
      null,
    );
  });

  it("formatUserTrackListenTooltip explains listens and adds plays when starts exceed listens", () => {
    expect(
      formatUserTrackListenTooltip({ play_count: 4, listen_count: 1 }),
    ).toBe(
      "4 plays, 1 listen. A listen is 30+ seconds in a row, or the full track. Skipping early does not count.",
    );
    expect(
      formatUserTrackListenTooltip({ play_count: 1, listen_count: 1 }),
    ).toBe(
      "A listen is 30+ seconds in a row, or the full track. Skipping early does not count.",
    );
  });

  it("buildYoutubeThumbnailUrl points at YouTube hqdefault art for a video id", () => {
    expect(buildYoutubeThumbnailUrl("dQw4w9WgXcQ")).toBe(
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    );
    expect(buildYoutubeThumbnailUrl('"><img')).toBeNull();
  });

  it("normalizeYoutubeVideoInput accepts bare ids and watch URLs", () => {
    expect(normalizeYoutubeVideoInput("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(
      normalizeYoutubeVideoInput("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBe("dQw4w9WgXcQ");
    expect(normalizeYoutubeVideoInput("not-a-link")).toBeNull();
  });

  it("mapUserYoutubeIdsByPosition maps stored youtube_id values by track position", () => {
    expect(
      mapUserYoutubeIdsByPosition(
        "42",
        [{ position: "A1" }, { position: "B1" }],
        {
          "42:A1": {
            play_count: 0,
            listen_count: 0,
            youtube_id: "abc12345678",
          },
          "42:B1": { play_count: 1, listen_count: 0, youtube_id: null },
        },
      ),
    ).toEqual({ A1: "abc12345678" });
  });

  it("mapUserYoutubeIdsByPosition trims stored youtube_id values", () => {
    expect(
      mapUserYoutubeIdsByPosition("42", [{ position: "A1" }], {
        "42:A1": {
          play_count: 0,
          listen_count: 0,
          youtube_id: "  abc12345678  ",
        },
      }),
    ).toEqual({ A1: "abc12345678" });
  });

  it("normalizeTrackStatsKeys dedupes and caps keys for stats API", () => {
    const keys = Array.from({ length: 101 }, (_, index) => `key-${index}`);

    expect(normalizeTrackStatsKeys(["a", "a", "b"])).toEqual(["a", "b"]);
    expect(normalizeTrackStatsKeys(keys)).toHaveLength(100);
  });

  it("normalizeTrackStatsKeys keeps prioritized keys when capping", () => {
    expect(
      normalizeTrackStatsKeys(["a", "b", "c", "d"], {
        max: 3,
        prioritizeKeys: ["d"],
      }),
    ).toEqual(["d", "a", "b"]);
  });

  it("mapTrackStatsByPosition keys rows by track position", () => {
    expect(
      mapTrackStatsByPosition("42", [{ position: "A1" }], {
        "42:A1": { play_count: 1, listen_count: 3 },
        "42:B1": { play_count: 9, listen_count: 0 },
      }),
    ).toEqual({ A1: { play_count: 1, listen_count: 3 } });
  });

  it("buildUserTrackFieldsFromRelease matches queue item builder", () => {
    const release = releaseFactory.withDisplayDefaults({
      instance_id: "99",
    });

    expect(
      buildUserTrackFieldsFromRelease({
        release,
        trackPosition: "B2",
        trackTitle: "Closer",
      }),
    ).toEqual(
      buildUserTrackFieldsFromQueueItem(
        createQueueItem({
          release,
          trackPosition: "B2",
          trackTitle: "Closer",
        }),
      ),
    );
  });
});
