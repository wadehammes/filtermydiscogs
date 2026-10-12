const GTM_YOUTUBE_STACK_MARKERS = [
  "googletagmanager.com/gtag/js",
  "gtag/js",
  "www-widgetapi",
  "widgetapi.vflset",
] as const;

const GTM_YOUTUBE_GET_DURATION_MESSAGE = "getDuration is not a function";

const errorStackIncludesGtmYoutube = (error: Error): boolean => {
  const stack = error.stack ?? "";

  return GTM_YOUTUBE_STACK_MARKERS.some((marker) => stack.includes(marker));
};

export const isGoogleTagManagerYoutubeIntegrationError = (
  error: unknown,
): boolean => {
  let current: unknown = error;

  while (current instanceof Error) {
    if (
      current.message.includes(GTM_YOUTUBE_GET_DURATION_MESSAGE) &&
      errorStackIncludesGtmYoutube(current)
    ) {
      return true;
    }

    current = current.cause;
  }

  return false;
};
