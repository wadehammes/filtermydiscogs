import { describe, expect, it } from "@jest/globals";
import {
  parsePlaybackSkipUserReportForm,
  playbackSkipUserReportFormInputSchema,
  playbackSkipUserReportFormResolverSchema,
} from "src/lib/validation/playbackSkipUserReport.schemas";

describe("playbackSkipUserReportFormSchema", () => {
  it("when category is set and note is empty, parses without note", () => {
    expect(
      parsePlaybackSkipUserReportForm({
        category: "plays_on_youtube_not_here",
        note: "",
      }),
    ).toEqual({
      category: "plays_on_youtube_not_here",
    });
  });

  it("when category is missing, resolver reports choose an option", () => {
    const result = playbackSkipUserReportFormResolverSchema.safeParse({
      note: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Choose an option");
    }
  });

  it("when note exceeds max length, rejects", () => {
    expect(() =>
      playbackSkipUserReportFormInputSchema.parse({
        category: "other",
        note: "x".repeat(501),
      }),
    ).toThrow();
  });
});
