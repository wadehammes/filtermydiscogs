import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { RELEASE_CARD_COVER_BLUR_SESSION_KEY } from "src/constants/storageKeys";
import { RELEASE_CARD_COVER_BLUR_ATTR } from "src/utils/releaseCardCoverBlurTier";
import { renderFeatureHook, waitFor } from "test-utils";

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
    jest.restoreAllMocks();
  });

  it("when session storage holds a tier, sets the document attribute on mount", () => {
    sessionStorage.setItem(RELEASE_CARD_COVER_BLUR_SESSION_KEY, "always");

    renderFeatureHook(() => useReleaseCardCoverBlurTierSync());

    expect(
      document.documentElement.getAttribute(RELEASE_CARD_COVER_BLUR_ATTR),
    ).toBe("always");
  });

  it("when session is cold, sets hover-only until idle measure completes", async () => {
    jest.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn((_event: Event) => false),
    }));

    const mockContext = {
      fillStyle: "",
      filter: "none",
      fillRect: jest.fn(),
      drawImage: jest.fn(),
    };

    const createElement = document.createElement.bind(document);
    jest
      .spyOn(document, "createElement")
      .mockImplementation((tagName, options) => {
        if (tagName === "canvas") {
          return {
            width: 0,
            height: 0,
            getContext: () => mockContext,
          } as unknown as HTMLCanvasElement;
        }

        return createElement(tagName, options);
      });

    let call = 0;
    jest.spyOn(performance, "now").mockImplementation(() => {
      call += 1;
      return call === 1 ? 0 : 4;
    });

    let idleCallback: IdleRequestCallback | undefined;
    window.requestIdleCallback = jest.fn((cb: IdleRequestCallback) => {
      idleCallback = cb;
      return 1;
    }) as typeof window.requestIdleCallback;
    window.cancelIdleCallback = jest.fn();

    renderFeatureHook(() => useReleaseCardCoverBlurTierSync());

    expect(
      document.documentElement.getAttribute(RELEASE_CARD_COVER_BLUR_ATTR),
    ).toBe("hover-only");

    idleCallback?.({
      didTimeout: false,
      timeRemaining: () => 50,
    } as IdleDeadline);

    await waitFor(() => {
      expect(
        document.documentElement.getAttribute(RELEASE_CARD_COVER_BLUR_ATTR),
      ).toBe("always");
    });
  });
});
