import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  measureReleaseCardCoverBlurTier,
  RELEASE_CARD_COVER_BLUR_SESSION_KEY,
  resolveReleaseCardCoverBlurTier,
} from "src/utils/releaseCardCoverBlurTier";

describe("releaseCardCoverBlurTier", () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.restoreAllMocks();
  });

  it("when reduced motion is preferred, resolves hover-only without benchmarking", () => {
    jest.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn((_event: Event) => false),
    }));

    expect(measureReleaseCardCoverBlurTier()).toBe("hover-only");
  });

  it("when the blur benchmark finishes within budget, resolves always", () => {
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

    jest.spyOn(document, "createElement").mockReturnValue({
      width: 0,
      height: 0,
      getContext: () => mockContext,
    } as unknown as HTMLCanvasElement);

    let call = 0;
    jest.spyOn(performance, "now").mockImplementation(() => {
      call += 1;
      return call === 1 ? 0 : 4;
    });

    expect(measureReleaseCardCoverBlurTier()).toBe("always");
  });

  it("when the blur benchmark exceeds budget, resolves hover-only", () => {
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

    jest.spyOn(document, "createElement").mockReturnValue({
      width: 0,
      height: 0,
      getContext: () => mockContext,
    } as unknown as HTMLCanvasElement);

    let call = 0;
    jest.spyOn(performance, "now").mockImplementation(() => {
      call += 1;
      return call === 1 ? 0 : 40;
    });

    expect(measureReleaseCardCoverBlurTier()).toBe("hover-only");
  });

  it("when session storage holds a tier, resolve returns the cached value", () => {
    sessionStorage.setItem(RELEASE_CARD_COVER_BLUR_SESSION_KEY, "always");

    expect(resolveReleaseCardCoverBlurTier()).toBe("always");
  });
});
