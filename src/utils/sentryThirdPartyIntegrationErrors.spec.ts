import { describe, expect, it } from "@jest/globals";
import { isGoogleTagManagerYoutubeIntegrationError } from "src/utils/sentryThirdPartyIntegrationErrors";

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
