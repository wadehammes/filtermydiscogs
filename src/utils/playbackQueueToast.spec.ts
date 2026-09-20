import { describe, expect, it } from "@jest/globals";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import {
  getPlaybackQueueToastPosition,
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

describe("showSimilarQueueTailToast", () => {
  it("shows a success toast when a similar tail track is appended", () => {
    showSimilarQueueTailToast();

    expect(mockToastSuccess).toHaveBeenCalledWith(
      "Added a related track from your collection to Up next.",
      expect.objectContaining({ position: expect.any(String) }),
    );
  });
});
