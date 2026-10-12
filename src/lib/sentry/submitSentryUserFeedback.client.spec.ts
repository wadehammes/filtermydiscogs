import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { SENTRY_USER_FEEDBACK_SUCCESS_TOAST_MESSAGE } from "src/constants/sentryUserFeedbackForm.constants";

const captureFeedback = jest.fn();
const resolveSentryEnabled = jest.fn<() => boolean>();
const toastSuccess = jest.fn();

jest.mock("@sentry/react", () => ({
  captureFeedback,
}));

jest.mock("src/lib/sentry/sentryInitOptions", () => ({
  resolveSentryEnabled,
}));

jest.mock("src/utils/toast", () => ({
  toast: {
    success: toastSuccess,
  },
}));

describe("submitSentryUserFeedback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resolveSentryEnabled.mockReturnValue(true);
  });

  it("when Sentry is disabled, does not send feedback", async () => {
    resolveSentryEnabled.mockReturnValue(false);
    const { submitSentryUserFeedback } = await import(
      "src/lib/sentry/submitSentryUserFeedback.client"
    );

    submitSentryUserFeedback({
      message: "Something broke",
      name: "",
      email: "",
    });

    expect(captureFeedback).not.toHaveBeenCalled();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("when a screenshot attachment is provided, includes it in the hint", async () => {
    const { submitSentryUserFeedback } = await import(
      "src/lib/sentry/submitSentryUserFeedback.client"
    );

    const screenshot = {
      data: new Uint8Array([1, 2, 3]),
      filename: "screenshot.png",
      contentType: "image/png",
    };

    submitSentryUserFeedback(
      {
        message: "Broken layout",
        name: "",
        email: "",
      },
      screenshot,
    );

    expect(captureFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Broken layout" }),
      { includeReplay: true, attachments: [screenshot] },
    );
    expect(toastSuccess).toHaveBeenCalledWith(
      SENTRY_USER_FEEDBACK_SUCCESS_TOAST_MESSAGE,
    );
  });

  it("sends feedback with replay and user_menu tag", async () => {
    const { submitSentryUserFeedback } = await import(
      "src/lib/sentry/submitSentryUserFeedback.client"
    );

    submitSentryUserFeedback({
      message: " Playback failed ",
      name: " Wade ",
      email: " wade@example.com ",
    });

    expect(captureFeedback).toHaveBeenCalledWith(
      {
        message: "Playback failed",
        name: "Wade",
        email: "wade@example.com",
        tags: {
          feedback_source: "user_menu",
        },
      },
      { includeReplay: true },
    );
    expect(toastSuccess).toHaveBeenCalledWith(
      SENTRY_USER_FEEDBACK_SUCCESS_TOAST_MESSAGE,
    );
  });
});
