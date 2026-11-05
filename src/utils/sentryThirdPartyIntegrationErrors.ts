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

const APPEND_CHILD_UNEXPECTED_IDENTIFIER_AS =
  "Failed to execute 'appendChild' on 'Node': Unexpected identifier 'as'";

const isAppendChildScriptSyntaxErrorMessage = (message: string): boolean => {
  if (message === APPEND_CHILD_UNEXPECTED_IDENTIFIER_AS) {
    return true;
  }

  if (message.startsWith("SyntaxError: ")) {
    return isAppendChildScriptSyntaxErrorMessage(
      message.slice("SyntaxError: ".length),
    );
  }

  return false;
};

const filenamesIncludeScript = (filenames: string[]): boolean =>
  filenames.some((filename) => SCRIPT_FILENAME.test(filename));

const isUnattributedInlineScriptSyntaxError = ({
  error,
  message,
  frameFilenames,
  matchesSyntaxMessage,
}: {
  error: unknown;
  message: string | undefined;
  frameFilenames: string[];
  matchesSyntaxMessage: (syntaxMessage: string) => boolean;
}): boolean => {
  const matchesMessage =
    someErrorInCauseChain(error, (current) =>
      matchesSyntaxMessage(current.message),
    ) ||
    (message !== undefined && matchesSyntaxMessage(message));

  if (!matchesMessage) {
    return false;
  }

  if (error instanceof Error && SCRIPT_FILENAME.test(error.stack ?? "")) {
    return false;
  }

  return !filenamesIncludeScript(frameFilenames);
};

export const isUnattributedExponentParseError = ({
  error,
  message,
  frameFilenames,
}: {
  error: unknown;
  message: string | undefined;
  frameFilenames: string[];
}): boolean =>
  isUnattributedInlineScriptSyntaxError({
    error,
    message,
    frameFilenames,
    matchesSyntaxMessage: isExponentParseErrorMessage,
  });

export const isUnattributedAppendChildScriptSyntaxError = ({
  error,
  message,
  frameFilenames,
}: {
  error: unknown;
  message: string | undefined;
  frameFilenames: string[];
}): boolean =>
  isUnattributedInlineScriptSyntaxError({
    error,
    message,
    frameFilenames,
    matchesSyntaxMessage: isAppendChildScriptSyntaxErrorMessage,
  });
