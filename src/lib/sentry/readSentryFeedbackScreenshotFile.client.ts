"use client";

import type { Attachment } from "@sentry/core";
import { SENTRY_USER_FEEDBACK_SCREENSHOT_MAX_BYTES } from "src/constants/sentryUserFeedbackForm.constants";
import { buildSentryFeedbackScreenshotAttachmentFromBlob } from "src/lib/sentry/buildSentryFeedbackScreenshotAttachment.client";

const ACCEPTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export type ReadSentryFeedbackScreenshotFileResult =
  | { ok: true; attachment: Attachment }
  | { ok: false; errorMessage: string };

export const readSentryFeedbackScreenshotFile = async (
  file: File,
): Promise<ReadSentryFeedbackScreenshotFileResult> => {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return {
      ok: false,
      errorMessage: "Choose a PNG, JPEG, or WebP image",
    };
  }

  if (file.size > SENTRY_USER_FEEDBACK_SCREENSHOT_MAX_BYTES) {
    return {
      ok: false,
      errorMessage: "Image must be 5 MB or smaller",
    };
  }

  const attachment =
    await buildSentryFeedbackScreenshotAttachmentFromBlob(file);

  if (!attachment) {
    return {
      ok: false,
      errorMessage: "Could not read that image",
    };
  }

  return {
    ok: true,
    attachment: {
      ...attachment,
      filename: file.name || attachment.filename,
    },
  };
};
