import { describe, expect, it } from "@jest/globals";
import {
  buildYoutubeNocookieEmbedPathUrl,
  buildYoutubeWatchUrl,
  isValidYoutubeVideoId,
} from "src/utils/youtubeVideoId";

describe("isValidYoutubeVideoId", () => {
  it("accepts 11-character YouTube ids", () => {
    expect(isValidYoutubeVideoId("dQw4w9WgXcQ")).toBe(true);
    expect(isValidYoutubeVideoId("e2eSilent01")).toBe(true);
  });

  it("rejects ids with unsafe characters", () => {
    expect(isValidYoutubeVideoId('"><script')).toBe(false);
    expect(isValidYoutubeVideoId("short")).toBe(false);
  });
});

describe("buildYoutubeWatchUrl", () => {
  it("builds a watch URL with the v query param", () => {
    expect(buildYoutubeWatchUrl("dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
  });

  it("returns null for invalid ids", () => {
    expect(buildYoutubeWatchUrl("not-valid")).toBeNull();
  });
});

describe("buildYoutubeNocookieEmbedPathUrl", () => {
  it("builds an embed URL with query params", () => {
    const params = new URLSearchParams({ enablejsapi: "1" });

    expect(buildYoutubeNocookieEmbedPathUrl("te2jJncBVG4", params)).toBe(
      "https://www.youtube-nocookie.com/embed/te2jJncBVG4?enablejsapi=1",
    );
  });

  it("returns null for invalid ids", () => {
    expect(
      buildYoutubeNocookieEmbedPathUrl("bad", new URLSearchParams()),
    ).toBeNull();
  });
});
