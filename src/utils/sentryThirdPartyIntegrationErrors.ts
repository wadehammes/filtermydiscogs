import { someErrorInCauseChain } from "src/utils/errorCauseChain";

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

const BROWSER_SCHEDULER_TERMINATION_MESSAGE =
  /callback `[^`]+` was terminated$/;

export const isBrowserSchedulerTerminationError = (error: unknown): boolean =>
  someErrorInCauseChain(error, (current) =>
    BROWSER_SCHEDULER_TERMINATION_MESSAGE.test(current.message),
  );

export const isGoogleTagManagerYoutubeIntegrationError = (
  error: unknown,
): boolean =>
  someErrorInCauseChain(
    error,
    (current) =>
      current.message.includes(GTM_YOUTUBE_GET_DURATION_MESSAGE) &&
      errorStackIncludesGtmYoutube(current),
  );
