import { beforeEach, describe, expect, it } from "@jest/globals";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import {
  getPlaybackQueueToastPosition,
  showPlaybackQueueRemovedToast,
  showSimilarQueueTailToast,
} from "src/utils/playbackQueueToast";
import { toast } from "src/utils/toast";

jest.mock("src/utils/toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockToastSuccess = jest.mocked(toast.success);

describe("playbackQueueToast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getPlaybackQueueToastPosition uses top-center on mobile viewports", () => {
    setupMockMatchMedia({ desktop: false });

    expect(getPlaybackQueueToastPosition()).toBe("top-center");
  });

  it("getPlaybackQueueToastPosition uses bottom-center on desktop viewports", () => {
    setupMockMatchMedia({ desktop: true });

    expect(getPlaybackQueueToastPosition()).toBe("bottom-center");
  });

  it("showPlaybackQueueRemovedToast shows a success toast for multiple removed tracks", () => {
    setupMockMatchMedia({ desktop: true });

    showPlaybackQueueRemovedToast(2);

    expect(mockToastSuccess).toHaveBeenCalledWith(
      "Removed 2 tracks from queue",
      expect.objectContaining({ position: "bottom-center" }),
    );
  });

  it("showSimilarQueueTailToast shows a success toast when a similar tail track is appended", () => {
    showSimilarQueueTailToast();

    expect(mockToastSuccess).toHaveBeenCalledWith(
      "Added a related track from your collection to Up next.",
      expect.objectContaining({ position: expect.any(String) }),
    );
  });
});
