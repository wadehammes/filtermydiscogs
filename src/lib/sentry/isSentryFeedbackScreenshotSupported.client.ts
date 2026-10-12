"use client";

export const isSentryFeedbackScreenshotSupported = (): boolean => {
  if (typeof navigator === "undefined") {
    return false;
  }

  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    )
  ) {
    return false;
  }

  if (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1) {
    return false;
  }

  if (typeof window !== "undefined" && !window.isSecureContext) {
    return false;
  }

  return Boolean(navigator.mediaDevices?.getDisplayMedia);
};
