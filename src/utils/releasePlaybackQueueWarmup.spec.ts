import { describe, expect, it } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  createPreviewQueueItem,
  createQueueItem,
} from "src/utils/playbackQueue";
import {
  getUpcomingQueueWarmupItems,
  UPCOMING_QUEUE_WARMUP_COUNT,
} from "src/utils/releasePlaybackQueueWarmup";

describe("releasePlaybackQueueWarmup", () => {
  it("getUpcomingQueueWarmupItems returns the first two track rows and skips preview-only items", () => {
    const release = releaseFactory.withDisplayDefaults();
    const queue = [
      createQueueItem({
        release,
        trackPosition: "A1",
        trackTitle: "One",
      }),
      createPreviewQueueItem({
        release,
        video: {
          description: "Preview",
          duration: 120,
          embed: true,
          title: "Two",
          uri: "https://www.youtube.com/watch?v=preview12345",
        },
      }),
      createQueueItem({
        release,
        trackPosition: "B1",
        trackTitle: "Three",
      }),
    ];

    expect(getUpcomingQueueWarmupItems(queue)).toEqual([queue[0], queue[2]]);

    expect(getUpcomingQueueWarmupItems(queue, 1)).toEqual([queue[0]]);
    expect(UPCOMING_QUEUE_WARMUP_COUNT).toBe(2);
  });
});
