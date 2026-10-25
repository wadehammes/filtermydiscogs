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

const SENTRY_DOM_ERROR_EVENT_REJECTION_MESSAGE =
  /^Event: Event `Event` \(type=error\) captured as promise rejection$/;

export const isDomErrorEventPromiseRejection = (error: unknown): boolean => {
  if (typeof Event !== "undefined" && error instanceof Event) {
    return error.type === "error";
  }

  return false;
};

export const isSentryDomErrorEventRejectionMessage = (
  message: string,
): boolean => SENTRY_DOM_ERROR_EVENT_REJECTION_MESSAGE.test(message);

const EXPONENT_PARSE_MESSAGE = "Non-number found after exponent indicator";

const SCRIPT_FILENAME = /\.(?:m?js|cjs)(?:$|\?)/i;

const isExponentParseErrorMessage = (message: string): boolean =>
  message === EXPONENT_PARSE_MESSAGE ||
  message === `SyntaxError: ${EXPONENT_PARSE_MESSAGE}`;

const errorMessageIsExponentParse = (error: unknown): boolean =>
  someErrorInCauseChain(error, (current) =>
    isExponentParseErrorMessage(current.message),
  );

const filenamesIncludeScript = (filenames: string[]): boolean =>
  filenames.some((filename) => SCRIPT_FILENAME.test(filename));

export const isUnattributedExponentParseError = ({
  error,
  message,
  frameFilenames,
}: {
  error: unknown;
  message: string | undefined;
  frameFilenames: string[];
}): boolean => {
  const matchesMessage =
    errorMessageIsExponentParse(error) ||
    (message !== undefined && isExponentParseErrorMessage(message));

  if (!matchesMessage) {
    return false;
  }

  if (error instanceof Error && SCRIPT_FILENAME.test(error.stack ?? "")) {
    return false;
  }

  return !filenamesIncludeScript(frameFilenames);
};
