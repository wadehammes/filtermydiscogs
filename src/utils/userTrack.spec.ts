import { describe, expect, it } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createQueueItem } from "src/utils/playbackQueue";
import {
  buildTrackKey,
  buildUserTrackFieldsFromQueueItem,
  buildUserTrackFieldsFromRelease,
  formatTopUserTrackHeadLabel,
  formatUserTrackStatsLabel,
  mapTrackStatsByPosition,
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
