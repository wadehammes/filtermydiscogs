import { describe, expect, it } from "@jest/globals";
import { adminYoutubeEmbedFormSchema } from "src/lib/validation/adminYoutubeEmbed.schemas";
import { TRACK_YOUTUBE_OVERRIDE_INVALID_INPUT_MESSAGE } from "src/lib/validation/userTrack.schemas";

describe("adminYoutubeEmbedFormSchema", () => {
  it("when youtubeInput is empty, rejects with the shared override message", () => {
    const result = adminYoutubeEmbedFormSchema.safeParse({
      youtubeInput: "   ",
      autoplay: false,
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        TRACK_YOUTUBE_OVERRIDE_INVALID_INPUT_MESSAGE,
      );
    }
  });

  it("when youtubeInput is a valid id, accepts autoplay flag", () => {
    expect(
      adminYoutubeEmbedFormSchema.safeParse({
        youtubeInput: "te2jJncBVG4",
        autoplay: true,
      }).success,
    ).toBe(true);
  });

  it("when youtubeInput is invalid, rejects", () => {
    const result = adminYoutubeEmbedFormSchema.safeParse({
      youtubeInput: "not-a-url",
      autoplay: false,
    });

    expect(result.success).toBe(false);
  });
});
