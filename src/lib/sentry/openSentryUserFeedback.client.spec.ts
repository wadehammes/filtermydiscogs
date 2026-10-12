import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const openSentryUserFeedbackDialog = jest.fn();
const resolveSentryEnabled = jest.fn<() => boolean>();

jest.mock("src/utils/sentryUserFeedbackDialogBridge", () => ({
  openSentryUserFeedbackDialog,
}));

jest.mock("src/lib/sentry/sentryInitOptions", () => ({
  resolveSentryEnabled,
}));

describe("openSentryUserFeedback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resolveSentryEnabled.mockReturnValue(true);
  });

  it("when Sentry is disabled, does not open the dialog", async () => {
    resolveSentryEnabled.mockReturnValue(false);
    const { openSentryUserFeedback } = await import(
      "src/lib/sentry/openSentryUserFeedback.client"
    );

    openSentryUserFeedback();

    expect(openSentryUserFeedbackDialog).not.toHaveBeenCalled();
  });

  it("when Sentry is enabled, opens the app feedback dialog", async () => {
    const { openSentryUserFeedback } = await import(
      "src/lib/sentry/openSentryUserFeedback.client"
    );

    openSentryUserFeedback();

    expect(openSentryUserFeedbackDialog).toHaveBeenCalledTimes(1);
  });
});
