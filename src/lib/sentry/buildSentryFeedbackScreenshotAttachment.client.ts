"use client";

import type { Attachment } from "@sentry/core";
import { SENTRY_USER_FEEDBACK_SCREENSHOT_FILENAME } from "src/constants/sentryUserFeedbackForm.constants";

export const buildSentryFeedbackScreenshotAttachmentFromBlob = async (
  blob: Blob,
): Promise<Attachment | undefined> => {
  if (blob.size === 0) {
    return undefined;
  }

  const arrayBuffer =
    typeof blob.arrayBuffer === "function"
      ? await blob.arrayBuffer()
      : await new Response(blob).arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  return {
    data,
    filename: SENTRY_USER_FEEDBACK_SCREENSHOT_FILENAME,
    contentType: blob.type || "image/png",
  };
};

export const buildSentryFeedbackScreenshotAttachmentFromVideo = async ({
  video,
  dpi,
}: {
  video: HTMLVideoElement;
  dpi: number;
}): Promise<Attachment | undefined> => {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    return undefined;
  }

  context.scale(dpi, dpi);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  if (!blob) {
    return undefined;
  }

  return buildSentryFeedbackScreenshotAttachmentFromBlob(blob);
};
