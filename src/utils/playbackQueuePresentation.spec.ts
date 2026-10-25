import { describe, expect, it } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createQueueItem } from "src/utils/playbackQueue";
import {
  isQueueItemTrackTitlePlaceholder,
  resolvePlaybackPresentationFromQueueItem,
  resolveQueueItemYoutubeVideoId,
} from "src/utils/playbackQueuePresentation";

describe("isQueueItemTrackTitlePlaceholder", () => {
  it("is true when trackTitle matches trackPosition from startPlayback defaults", () => {
    const item = createQueueItem({
      release: releaseFactory.withDisplayDefaults({ instance_id: 1 }),
      trackPosition: "A",
      trackTitle: "A",
    });

    expect(isQueueItemTrackTitlePlaceholder(item)).toBe(true);
  });
});

describe("resolveQueueItemYoutubeVideoId", () => {
  it("returns the YouTube id stored on the queue item", () => {
    const item = createQueueItem({
      release: releaseFactory.withDisplayDefaults({ instance_id: 1 }),
      trackPosition: "A1",
      trackTitle: "Moodita",
      youtubeVideoId: "moodita-yt",
    });

    expect(resolveQueueItemYoutubeVideoId(item)).toBe("moodita-yt");
  });
});

describe("resolvePlaybackPresentationFromQueueItem", () => {
  it("prefers UserTrack artist over the release artist list", () => {
    const release = releaseFactory.withDisplayDefaults({
      instance_id: 9001,
      artistName: "Janeret & Miroloja",
    });
    const item = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "Moodita",
      artist: "D I N",
      releaseTitle: "Moodita EP",
    });

    expect(resolvePlaybackPresentationFromQueueItem(item)).toEqual({
      trackTitle: "A1 - Moodita",
      artistLabel: "D I N",
    });
  });
});
