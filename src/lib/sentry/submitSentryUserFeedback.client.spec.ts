import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import type { captureFeedback } from "@sentry/react";
import { SENTRY_USER_FEEDBACK_SUCCESS_TOAST_MESSAGE } from "src/constants/sentryUserFeedbackForm.constants";
import type { resolveSentryEnabled } from "src/lib/sentry/sentryInitOptions";
import {
  getMockedExport,
  getMockedModule,
} from "src/tests/mocks/getMockedExport";
import type { toast } from "src/utils/toast";

jest.mock("@sentry/react", () => ({
  captureFeedback: jest.fn(),
}));

jest.mock("src/lib/sentry/sentryInitOptions", () => ({
  resolveSentryEnabled: jest.fn(),
}));

jest.mock("src/utils/toast", () => ({
  toast: {
    success: jest.fn(),
  },
}));

const mockCaptureFeedback = getMockedExport<typeof captureFeedback>(
  "@sentry/react",
  "captureFeedback",
);

const mockResolveSentryEnabled = getMockedExport<typeof resolveSentryEnabled>(
  "src/lib/sentry/sentryInitOptions",
  "resolveSentryEnabled",
);

const mockToastSuccess = getMockedModule<{ toast: typeof toast }>(
  "src/utils/toast",
).toast.success;

describe("submitSentryUserFeedback", () => {
  let submitSentryUserFeedback: typeof import("src/lib/sentry/submitSentryUserFeedback.client").submitSentryUserFeedback;

  beforeAll(async () => {
    ({ submitSentryUserFeedback } = await import(
      "src/lib/sentry/submitSentryUserFeedback.client"
    ));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockResolveSentryEnabled.mockReturnValue(true);
  });

  it("when Sentry is disabled, does not send feedback", () => {
    mockResolveSentryEnabled.mockReturnValue(false);

    submitSentryUserFeedback({
      message: "Something broke",
      name: "",
      email: "",
    });

    expect(mockCaptureFeedback).not.toHaveBeenCalled();
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it("when a screenshot attachment is provided, includes it in the hint", () => {
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

    expect(mockCaptureFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Broken layout" }),
      { includeReplay: true, attachments: [screenshot] },
    );
    expect(mockToastSuccess).toHaveBeenCalledWith(
      SENTRY_USER_FEEDBACK_SUCCESS_TOAST_MESSAGE,
    );
  });

  it("sends feedback with replay and user_menu tag", () => {
    submitSentryUserFeedback({
      message: " Playback failed ",
      name: " Wade ",
      email: " wade@example.com ",
    });

    expect(mockCaptureFeedback).toHaveBeenCalledWith(
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
    expect(mockToastSuccess).toHaveBeenCalledWith(
      SENTRY_USER_FEEDBACK_SUCCESS_TOAST_MESSAGE,
    );
  });
});
