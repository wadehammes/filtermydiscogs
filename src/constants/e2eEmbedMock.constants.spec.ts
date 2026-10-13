import { describe, expect, it } from "@jest/globals";
import {
  appendE2eEmbedMockQueryParams,
  E2E_EMBED_MOCK_DELAYED_PLAYING_MS,
  E2E_EMBED_MOCK_VIDEO_IDS,
  isE2eHarnessMockVideoId,
  resolveE2eEmbedMockModeForVideoId,
} from "src/constants/e2eEmbedMock.constants";

describe("e2eEmbedMock.constants", () => {
  it("maps reserved mock video ids to embed modes", () => {
    expect(
      resolveE2eEmbedMockModeForVideoId(E2E_EMBED_MOCK_VIDEO_IDS.normal),
    ).toBe("normal");
    expect(
      resolveE2eEmbedMockModeForVideoId(E2E_EMBED_MOCK_VIDEO_IDS.silent),
    ).toBe("silent");
    expect(
      resolveE2eEmbedMockModeForVideoId(E2E_EMBED_MOCK_VIDEO_IDS.delayed),
    ).toBe("delayed");
    expect(
      resolveE2eEmbedMockModeForVideoId(E2E_EMBED_MOCK_VIDEO_IDS.error),
    ).toBe("error");
    expect(resolveE2eEmbedMockModeForVideoId("unknownVideo1")).toBeNull();
  });

  it("isE2eHarnessMockVideoId is true for silent delayed and error ids only", () => {
    expect(isE2eHarnessMockVideoId(E2E_EMBED_MOCK_VIDEO_IDS.normal)).toBe(
      false,
    );
    expect(isE2eHarnessMockVideoId(E2E_EMBED_MOCK_VIDEO_IDS.silent)).toBe(true);
    expect(isE2eHarnessMockVideoId(E2E_EMBED_MOCK_VIDEO_IDS.delayed)).toBe(
      true,
    );
    expect(isE2eHarnessMockVideoId(E2E_EMBED_MOCK_VIDEO_IDS.error)).toBe(true);
  });

  it("appendE2eEmbedMockQueryParams adds mode and delay for harness video ids", () => {
    const normalParams = new URLSearchParams({ videoId: "te2jJncBVG4" });
    appendE2eEmbedMockQueryParams(
      normalParams,
      E2E_EMBED_MOCK_VIDEO_IDS.normal,
    );
    expect(normalParams.get("mode")).toBeNull();

    const silentParams = new URLSearchParams({
      videoId: E2E_EMBED_MOCK_VIDEO_IDS.silent,
    });
    appendE2eEmbedMockQueryParams(
      silentParams,
      E2E_EMBED_MOCK_VIDEO_IDS.silent,
    );
    expect(silentParams.get("mode")).toBe("silent");

    const delayedParams = new URLSearchParams({
      videoId: E2E_EMBED_MOCK_VIDEO_IDS.delayed,
    });
    appendE2eEmbedMockQueryParams(
      delayedParams,
      E2E_EMBED_MOCK_VIDEO_IDS.delayed,
    );
    expect(delayedParams.get("mode")).toBe("delayed");
    expect(delayedParams.get("delayMs")).toBe(
      String(E2E_EMBED_MOCK_DELAYED_PLAYING_MS),
    );
  });
});
