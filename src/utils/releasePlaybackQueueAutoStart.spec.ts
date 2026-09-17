import { describe, expect, it } from "@jest/globals";
import { shouldAutoStartPlaybackOnQueueAdd } from "src/utils/releasePlaybackQueueAutoStart";

describe("shouldAutoStartPlaybackOnQueueAdd", () => {
  it("auto-starts when the queue is empty and nothing is playing", () => {
    expect(
      shouldAutoStartPlaybackOnQueueAdd({
        autoPlayOnQueueAdd: true,
        hasActiveRelease: false,
        queueLength: 0,
      }),
    ).toBe(true);
  });

  it("does not auto-start when a release is already active", () => {
    expect(
      shouldAutoStartPlaybackOnQueueAdd({
        autoPlayOnQueueAdd: true,
        hasActiveRelease: true,
        queueLength: 0,
      }),
    ).toBe(false);
  });
});
