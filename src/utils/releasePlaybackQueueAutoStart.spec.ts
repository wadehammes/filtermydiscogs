import { describe, expect, it } from "@jest/globals";
import { shouldAutoStartPlaybackOnQueueAdd } from "src/utils/releasePlaybackQueueAutoStart";

describe("shouldAutoStartPlaybackOnQueueAdd", () => {
  it("auto-starts when the queue is empty and nothing is playing", () => {
    expect(
      shouldAutoStartPlaybackOnQueueAdd({
        autoPlayOnQueueAdd: true,
        hasActiveRelease: false,
        isTransportActive: false,
        queueLength: 0,
      }),
    ).toBe(true);
  });

  it("does not auto-start when transport is active on an empty queue", () => {
    expect(
      shouldAutoStartPlaybackOnQueueAdd({
        autoPlayOnQueueAdd: true,
        hasActiveRelease: true,
        isTransportActive: true,
        queueLength: 0,
      }),
    ).toBe(false);
  });

  it("auto-starts when a release is still loaded but transport is inactive", () => {
    expect(
      shouldAutoStartPlaybackOnQueueAdd({
        autoPlayOnQueueAdd: true,
        hasActiveRelease: true,
        isTransportActive: false,
        queueLength: 0,
      }),
    ).toBe(true);
  });
});
