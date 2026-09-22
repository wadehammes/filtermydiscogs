import { describe, expect, it } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  createPreviewQueueItem,
  createQueueItem,
} from "src/utils/playbackQueue";
import { isQueueItemReplayOfActiveSession } from "src/utils/playbackQueueReplay";

describe("playbackQueueReplay", () => {
  const release = releaseFactory.withDisplayDefaults();
  const otherRelease = releaseFactory.withDisplayDefaults();

  it("when the active album track is queued again, the upcoming row is a replay", () => {
    const item = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "Track",
    });

    expect(
      isQueueItemReplayOfActiveSession(item, {
        release,
        activeTrackPosition: "A1",
        isReleasePreview: false,
        activeVideoId: "te2jJncBVG4",
      }),
    ).toBe(true);
  });

  it("when the next row is a different position on the same upload, it is not a replay", () => {
    const item = createQueueItem({
      release,
      trackPosition: "B1",
      trackTitle: "Other",
    });

    expect(
      isQueueItemReplayOfActiveSession(item, {
        release,
        activeTrackPosition: "A1",
        isReleasePreview: false,
        activeVideoId: "te2jJncBVG4",
      }),
    ).toBe(false);
  });

  it("when the release instance does not match, it is not a replay", () => {
    const item = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "Track",
    });

    expect(
      isQueueItemReplayOfActiveSession(item, {
        release: otherRelease,
        activeTrackPosition: "A1",
        isReleasePreview: false,
        activeVideoId: "te2jJncBVG4",
      }),
    ).toBe(false);
  });

  it("when the active preview video is queued again, the upcoming preview row is a replay", () => {
    const videoUri = "https://www.youtube.com/watch?v=abcd1234567";
    const item = createPreviewQueueItem({
      release,
      video: {
        description: "Preview",
        duration: 120,
        embed: true,
        title: "Preview upload",
        uri: videoUri,
      },
    });

    expect(
      isQueueItemReplayOfActiveSession(item, {
        release,
        activeTrackPosition: null,
        isReleasePreview: true,
        activeVideoId: "abcd1234567",
      }),
    ).toBe(true);
  });
});
