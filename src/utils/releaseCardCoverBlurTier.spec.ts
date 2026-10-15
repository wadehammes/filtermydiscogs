import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { RELEASE_CARD_COVER_BLUR_SESSION_KEY } from "src/constants/storageKeys";
import {
  applyReleaseCardCoverBlurTierToDocument,
  measureReleaseCardCoverBlurTier,
  RELEASE_CARD_COVER_BLUR_ATTR,
  resolveReleaseCardCoverBlurTier,
} from "src/utils/releaseCardCoverBlurTier";

const mockMatchMedia = (matchesForQuery: (query: string) => boolean) => {
  jest.spyOn(window, "matchMedia").mockImplementation((query) => ({
    matches: matchesForQuery(query),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn((_event: Event) => false),
  }));
};

const mockCanvasBenchmark = (elapsedMs: number) => {
  const mockContext = {
    fillStyle: "",
    filter: "none",
    fillRect: jest.fn(),
    drawImage: jest.fn(),
  };

  jest.spyOn(document, "createElement").mockReturnValue({
    width: 0,
    height: 0,
    getContext: () => mockContext,
  } as unknown as HTMLCanvasElement);

  let call = 0;
  jest.spyOn(performance, "now").mockImplementation(() => {
    call += 1;
    return call === 1 ? 0 : elapsedMs;
  });
};

describe("releaseCardCoverBlurTier", () => {
  beforeEach(() => {
    sessionStorage.clear();
    document.documentElement.removeAttribute(RELEASE_CARD_COVER_BLUR_ATTR);
    jest.restoreAllMocks();
  });

  it("when reduced motion is preferred, resolves hover-only without benchmarking", () => {
    mockMatchMedia((query) => query === "(prefers-reduced-motion: reduce)");

    expect(measureReleaseCardCoverBlurTier()).toBe("hover-only");
  });

  it("when update is slow, resolves hover-only without benchmarking", () => {
    mockMatchMedia((query) => query === "(update: slow)");

    expect(measureReleaseCardCoverBlurTier()).toBe("hover-only");
  });

  it("when the blur benchmark finishes within budget, resolves always", () => {
    mockMatchMedia(() => false);
    mockCanvasBenchmark(4);

    expect(measureReleaseCardCoverBlurTier()).toBe("always");
  });

  it("when the blur benchmark exceeds budget, resolves hover-only", () => {
    mockMatchMedia(() => false);
    mockCanvasBenchmark(40);

    expect(measureReleaseCardCoverBlurTier()).toBe("hover-only");
  });

  it("when session storage holds a tier, resolve returns the cached value", () => {
    sessionStorage.setItem(RELEASE_CARD_COVER_BLUR_SESSION_KEY, "always");

    expect(resolveReleaseCardCoverBlurTier()).toBe("always");
  });

  it("when apply receives the current tier, does not rewrite the document attribute", () => {
    document.documentElement.setAttribute(
      RELEASE_CARD_COVER_BLUR_ATTR,
      "always",
    );
    const setAttribute = jest.spyOn(document.documentElement, "setAttribute");

    applyReleaseCardCoverBlurTierToDocument("always");

    expect(setAttribute).not.toHaveBeenCalled();
  });

  it("when apply receives a new tier, sets the document attribute", () => {
    applyReleaseCardCoverBlurTierToDocument("hover-only");

    expect(
      document.documentElement.getAttribute(RELEASE_CARD_COVER_BLUR_ATTR),
    ).toBe("hover-only");
  });
});
