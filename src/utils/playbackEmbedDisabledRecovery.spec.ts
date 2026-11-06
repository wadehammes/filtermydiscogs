import { describe, expect, it } from "@jest/globals";
import {
  shouldRemountYoutubeEmbedAfterEmbedDisabledError,
  YOUTUBE_EMBED_DISABLED_ERROR_CODES,
} from "src/utils/playbackEmbedDisabledRecovery";
import {
  YOUTUBE_EMBED_ERROR_EMBED_DISABLED,
  YOUTUBE_EMBED_ERROR_EMBED_DISABLED_ALT,
} from "src/utils/playbackSkippedTrackLog";

describe("shouldRemountYoutubeEmbedAfterEmbedDisabledError", () => {
  it("when error is embed disabled and video id was not remounted yet, returns true", () => {
    expect(
      shouldRemountYoutubeEmbedAfterEmbedDisabledError({
        errorCode: YOUTUBE_EMBED_ERROR_EMBED_DISABLED,
        videoId: "sLz22C_pCrM",
        attemptedVideoIds: new Set(),
      }),
    ).toBe(true);
  });

  it("when the same video id already had a src remount attempt, returns false", () => {
    expect(
      shouldRemountYoutubeEmbedAfterEmbedDisabledError({
        errorCode: YOUTUBE_EMBED_ERROR_EMBED_DISABLED_ALT,
        videoId: "sLz22C_pCrM",
        attemptedVideoIds: new Set(["sLz22C_pCrM"]),
      }),
    ).toBe(false);
  });

  it("when error is not embed disabled, returns false", () => {
    expect(
      shouldRemountYoutubeEmbedAfterEmbedDisabledError({
        errorCode: 100,
        videoId: "sLz22C_pCrM",
        attemptedVideoIds: new Set(),
      }),
    ).toBe(false);
  });

  it("exports both YouTube embed-disabled codes", () => {
    expect(YOUTUBE_EMBED_DISABLED_ERROR_CODES).toEqual([
      YOUTUBE_EMBED_ERROR_EMBED_DISABLED,
      YOUTUBE_EMBED_ERROR_EMBED_DISABLED_ALT,
    ]);
  });
});
