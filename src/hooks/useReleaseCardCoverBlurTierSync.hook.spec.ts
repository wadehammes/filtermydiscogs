import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import {
  RELEASE_CARD_COVER_BLUR_ATTR,
  RELEASE_CARD_COVER_BLUR_SESSION_KEY,
} from "src/constants/storageKeys";
import { applyReleaseCardCoverBlurTierToDocument } from "src/utils/releaseCardCoverBlurTier";
import { renderFeatureHook } from "test-utils";

const mockScheduleReleaseCardCoverBlurTierMeasure =
  jest.fn<
    typeof import("src/utils/releaseCardCoverBlurTier").scheduleReleaseCardCoverBlurTierMeasure
  >();

jest.mock("src/utils/releaseCardCoverBlurTier", () => {
  const actual = jest.requireActual<
    typeof import("src/utils/releaseCardCoverBlurTier")
  >("src/utils/releaseCardCoverBlurTier");

  return {
    ...actual,
    scheduleReleaseCardCoverBlurTierMeasure:
      mockScheduleReleaseCardCoverBlurTierMeasure,
  };
});

describe("useReleaseCardCoverBlurTierSync", () => {
  let useReleaseCardCoverBlurTierSync: typeof import("src/hooks/useReleaseCardCoverBlurTierSync.hook").useReleaseCardCoverBlurTierSync;

  beforeAll(async () => {
    ({ useReleaseCardCoverBlurTierSync } = await import(
      "src/hooks/useReleaseCardCoverBlurTierSync.hook"
    ));
  });

  beforeEach(() => {
    sessionStorage.clear();
    document.documentElement.removeAttribute(RELEASE_CARD_COVER_BLUR_ATTR);
    mockScheduleReleaseCardCoverBlurTierMeasure.mockReset();
    mockScheduleReleaseCardCoverBlurTierMeasure.mockImplementation(
      jest.requireActual<typeof import("src/utils/releaseCardCoverBlurTier")>(
        "src/utils/releaseCardCoverBlurTier",
      ).scheduleReleaseCardCoverBlurTierMeasure,
    );
  });

  it("when session storage holds a tier, sets the document attribute on mount", () => {
    sessionStorage.setItem(RELEASE_CARD_COVER_BLUR_SESSION_KEY, "always");

    renderFeatureHook(() => useReleaseCardCoverBlurTierSync());

    expect(
      document.documentElement.getAttribute(RELEASE_CARD_COVER_BLUR_ATTR),
    ).toBe("always");
  });

  it("when session is cold, applies hover-only and schedules idle measure", () => {
    mockScheduleReleaseCardCoverBlurTierMeasure.mockReturnValue(jest.fn());

    renderFeatureHook(() => useReleaseCardCoverBlurTierSync());

    expect(
      document.documentElement.getAttribute(RELEASE_CARD_COVER_BLUR_ATTR),
    ).toBe("hover-only");
    expect(mockScheduleReleaseCardCoverBlurTierMeasure).toHaveBeenCalledWith(
      applyReleaseCardCoverBlurTierToDocument,
    );
  });

  it("when session is warm, does not schedule idle measure", () => {
    sessionStorage.setItem(RELEASE_CARD_COVER_BLUR_SESSION_KEY, "always");

    renderFeatureHook(() => useReleaseCardCoverBlurTierSync());

    expect(mockScheduleReleaseCardCoverBlurTierMeasure).not.toHaveBeenCalled();
  });
});
