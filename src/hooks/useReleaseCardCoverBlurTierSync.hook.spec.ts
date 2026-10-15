import { beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { RELEASE_CARD_COVER_BLUR_SESSION_KEY } from "src/constants/storageKeys";
import { RELEASE_CARD_COVER_BLUR_ATTR } from "src/utils/releaseCardCoverBlurTier";
import { renderFeatureHook } from "test-utils";

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
  });

  it("when session storage holds a tier, sets the document attribute on mount", () => {
    sessionStorage.setItem(RELEASE_CARD_COVER_BLUR_SESSION_KEY, "always");

    renderFeatureHook(() => useReleaseCardCoverBlurTierSync());

    expect(
      document.documentElement.getAttribute(RELEASE_CARD_COVER_BLUR_ATTR),
    ).toBe("always");
  });
});
