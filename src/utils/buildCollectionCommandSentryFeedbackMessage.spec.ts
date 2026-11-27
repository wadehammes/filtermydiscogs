import { describe, expect, it } from "@jest/globals";
import { buildCollectionCommandSentryFeedbackMessage } from "src/utils/buildCollectionCommandSentryFeedbackMessage";

describe("buildCollectionCommandSentryFeedbackMessage", () => {
  it("includes the trimmed prompt and selected issue when no details are provided", () => {
    expect(
      buildCollectionCommandSentryFeedbackMessage({
        context: { prompt: "  jazz on vinyl  " },
        categoryLabel: "Something else",
      }),
    ).toBe(
      [
        "Collection command issue",
        "",
        "Prompt: jazz on vinyl",
        "",
        "Issue: Something else",
      ].join("\n"),
    );
  });

  it("adds interpret errors, preview facts, and optional details when present", () => {
    expect(
      buildCollectionCommandSentryFeedbackMessage({
        context: {
          prompt: "deep house",
          interpretError: "Gateway timeout",
          preview: {
            matchCount: 3,
            facts: [
              { label: "Style", value: "Deep House" },
              { label: "Sort", value: "Artist A–Z" },
            ],
          },
        },
        categoryLabel: "Preview count or facts look wrong",
        details: "Expected zero matches",
      }),
    ).toBe(
      [
        "Collection command issue",
        "",
        "Prompt: deep house",
        "",
        "Interpret error: Gateway timeout",
        "",
        "Matches: 3",
        "Style: Deep House",
        "Sort: Artist A–Z",
        "",
        "Issue: Preview count or facts look wrong",
        "",
        "Details:",
        "Expected zero matches",
      ].join("\n"),
    );
  });
});
