"use client";

import type { Attachment } from "@sentry/core";
import { buildSentryFeedbackScreenshotAttachmentFromVideo } from "src/lib/sentry/buildSentryFeedbackScreenshotAttachment.client";
import { isSentryFeedbackScreenshotSupported } from "src/lib/sentry/isSentryFeedbackScreenshotSupported.client";

const isScreenshotCaptureCancelled = (error: unknown): boolean => {
  if (!(error instanceof DOMException)) {
    return false;
  }

  return (
    error.name === "NotAllowedError" ||
    error.name === "AbortError" ||
    error.name === "NotFoundError"
  );
};

export const captureSentryFeedbackScreenshot = async (): Promise<
  Attachment | undefined
> => {
  if (!isSentryFeedbackScreenshotSupported()) {
    return undefined;
  }

  const dpi = window.devicePixelRatio ?? 1;

  const stream = await navigator.mediaDevices
    .getDisplayMedia({
      video: {
        width: window.innerWidth * dpi,
        height: window.innerHeight * dpi,
      },
      audio: false,
      monitorTypeSurfaces: "exclude",
      preferCurrentTab: true,
      selfBrowserSurface: "include",
      surfaceSwitching: "exclude",
    } as DisplayMediaStreamOptions)
    .catch((error: unknown) => {
      if (isScreenshotCaptureCancelled(error)) {
        return undefined;
      }

      throw error;
    });

  if (!stream) {
    return undefined;
  }

  try {
    const video = document.createElement("video");
    video.srcObject = stream;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => {
        video
          .play()
          .then(() => {
            resolve();
          })
          .catch(reject);
      };
      video.onerror = () => {
        reject(new Error("Screenshot video failed to load"));
      };
    });

    return buildSentryFeedbackScreenshotAttachmentFromVideo({ video, dpi });
  } finally {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }
};
