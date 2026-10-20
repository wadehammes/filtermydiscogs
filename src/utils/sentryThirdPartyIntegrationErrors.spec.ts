import { describe, expect, it } from "@jest/globals";
import {
  isBrowserSchedulerTerminationError,
  isDomErrorEventPromiseRejection,
  isGoogleTagManagerYoutubeIntegrationError,
  isSentryDomErrorEventRejectionMessage,
} from "src/utils/sentryThirdPartyIntegrationErrors";

describe("isBrowserSchedulerTerminationError", () => {
  it("when timer callback was terminated on navigation, matches", () => {
    expect(
      isBrowserSchedulerTerminationError(
        new Error("callback `timer callback` was terminated"),
      ),
    ).toBe(true);
  });

  it("when unrelated timer errors occur, ignores", () => {
    expect(
      isBrowserSchedulerTerminationError(new Error("Timeout expired")),
    ).toBe(false);
  });
});

describe("isGoogleTagManagerYoutubeIntegrationError", () => {
  it("when GTM YouTube onStateChange throws getDuration, matches", () => {
    const error = new TypeError("a.getDuration is not a function");
    error.stack = [
      "TypeError: a.getDuration is not a function",
      "    at f (https://www.googletagmanager.com/gtag/js?id=GTM-XXX:908:224)",
      "    at n.H (https://www.youtube.com/s/player/ec429320/www-widgetapi.vflset/www-widgetapi.js:136:278)",
    ].join("\n");

    expect(isGoogleTagManagerYoutubeIntegrationError(error)).toBe(true);
  });

  it("when getDuration fails without GTM or YouTube iframe API frames, ignores", () => {
    const error = new TypeError("a.getDuration is not a function");
    error.stack =
      "TypeError: a.getDuration is not a function\n    at play (/app.js:1:1)";

    expect(isGoogleTagManagerYoutubeIntegrationError(error)).toBe(false);
  });

  it("when unrelated errors occur in GTM script, ignores", () => {
    const error = new Error("Unexpected token");
    error.stack =
      "Error: Unexpected token\n    at https://www.googletagmanager.com/gtag/js?id=GTM-XXX:1:1";

    expect(isGoogleTagManagerYoutubeIntegrationError(error)).toBe(false);
  });
});

describe("isDomErrorEventPromiseRejection", () => {
  it("when unhandled rejection reason is a DOM error event, matches", () => {
    const domError = new Event("error");

    expect(isDomErrorEventPromiseRejection(domError)).toBe(true);
  });

  it("when rejection reason is a normal Error, ignores", () => {
    expect(isDomErrorEventPromiseRejection(new Error("fail"))).toBe(false);
  });
});

describe("isSentryDomErrorEventRejectionMessage", () => {
  it("when Sentry titles a DOM error event rejection, matches", () => {
    expect(
      isSentryDomErrorEventRejectionMessage(
        "Event: Event `Event` (type=error) captured as promise rejection",
      ),
    ).toBe(true);
  });

  it("when message is unrelated, ignores", () => {
    expect(
      isSentryDomErrorEventRejectionMessage("Network request failed"),
    ).toBe(false);
  });
});
