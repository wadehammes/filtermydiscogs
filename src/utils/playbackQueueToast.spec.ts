import { describe, expect, it } from "@jest/globals";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { getPlaybackQueueToastPosition } from "src/utils/playbackQueueToast";

describe("getPlaybackQueueToastPosition", () => {
  it("uses top-center on mobile viewports", () => {
    setupMockMatchMedia({ desktop: false });

    expect(getPlaybackQueueToastPosition()).toBe("top-center");
  });

  it("uses bottom-center on desktop viewports", () => {
    setupMockMatchMedia({ desktop: true });

    expect(getPlaybackQueueToastPosition()).toBe("bottom-center");
  });
});
