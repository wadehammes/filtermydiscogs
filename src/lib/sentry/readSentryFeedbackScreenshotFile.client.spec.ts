import { describe, expect, it } from "@jest/globals";
import { readSentryFeedbackScreenshotFile } from "src/lib/sentry/readSentryFeedbackScreenshotFile.client";

describe("readSentryFeedbackScreenshotFile", () => {
  it("when the file type is not an image, returns an error", async () => {
    const file = new File(["text"], "notes.txt", { type: "text/plain" });

    const result = await readSentryFeedbackScreenshotFile(file);

    expect(result).toEqual({
      ok: false,
      errorMessage: "Choose a PNG, JPEG, or WebP image",
    });
  });

  it("when the file is a PNG, returns an attachment", async () => {
    const file = new File([Uint8Array.from([137, 80, 78, 71])], "bug.png", {
      type: "image/png",
    });

    const result = await readSentryFeedbackScreenshotFile(file);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.attachment.filename).toBe("bug.png");
      expect(result.attachment.contentType).toBe("image/png");
    }
  });
});
