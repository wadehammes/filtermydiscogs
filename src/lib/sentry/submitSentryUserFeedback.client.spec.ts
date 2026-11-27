import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import type { captureFeedback } from "@sentry/react";
import {
  SENTRY_CLIENT_DELIVERY_FAILED_TOAST_MESSAGE,
  SENTRY_COLLECTION_COMMAND_FEEDBACK_SOURCE_TAG,
  SENTRY_USER_FEEDBACK_SUCCESS_TOAST_MESSAGE,
} from "src/constants/sentryUserFeedbackForm.constants";
import type { deliverSentryClientCapture } from "src/lib/sentry/deliverSentryClientCapture.client";
import {
  getMockedExport,
  getMockedModule,
} from "src/tests/mocks/getMockedExport";
import type { toast } from "src/utils/toast";

jest.mock("@sentry/react", () => ({
  captureFeedback: jest.fn(),
}));

jest.mock("src/lib/sentry/deliverSentryClientCapture.client", () => ({
  deliverSentryClientCapture: jest.fn(),
}));

jest.mock("src/utils/toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockNotifyBugReportReceiptAfterSubmit =
  jest.fn<
    (
      values: { message: string; name: string; email: string },
      feedbackSourceTag?: string,
    ) => Promise<void>
  >();

jest.mock("src/lib/sentry/notifyBugReportReceipt.client", () => ({
  notifyBugReportReceiptAfterSubmit: mockNotifyBugReportReceiptAfterSubmit,
}));

const mockCaptureFeedback = getMockedExport<typeof captureFeedback>(
  "@sentry/react",
  "captureFeedback",
);

const mockDeliverSentryClientCapture = getMockedExport<
  typeof deliverSentryClientCapture
>(
  "src/lib/sentry/deliverSentryClientCapture.client",
  "deliverSentryClientCapture",
);

const mockToastSuccess = getMockedModule<{ toast: typeof toast }>(
  "src/utils/toast",
).toast.success;

const mockToastError = getMockedModule<{ toast: typeof toast }>(
  "src/utils/toast",
).toast.error;

describe("submitSentryUserFeedback", () => {
  let submitSentryUserFeedback: typeof import("src/lib/sentry/submitSentryUserFeedback.client").submitSentryUserFeedback;

  beforeAll(async () => {
    ({ submitSentryUserFeedback } = await import(
      "src/lib/sentry/submitSentryUserFeedback.client"
    ));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDeliverSentryClientCapture.mockImplementation(async (capture) => {
      capture();
      return true;
    });
    mockNotifyBugReportReceiptAfterSubmit.mockResolvedValue(undefined);
  });

  it("when delivery fails, shows an error toast and returns false", async () => {
    mockDeliverSentryClientCapture.mockImplementation(async (capture) => {
      capture();
      return false;
    });

    await expect(
      submitSentryUserFeedback({
        message: "Something broke",
        name: "",
        email: "",
      }),
    ).resolves.toBe(false);

    expect(mockCaptureFeedback).toHaveBeenCalledTimes(1);
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalledWith(
      SENTRY_CLIENT_DELIVERY_FAILED_TOAST_MESSAGE,
    );
  });

  it("when a screenshot attachment is provided, includes it in the hint", async () => {
    const screenshot = {
      data: new Uint8Array([1, 2, 3]),
      filename: "screenshot.png",
      contentType: "image/png",
    };

    await expect(
      submitSentryUserFeedback(
        {
          message: "Broken layout",
          name: "",
          email: "",
        },
        screenshot,
      ),
    ).resolves.toBe(true);

    expect(mockCaptureFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Broken layout" }),
      { includeReplay: true, attachments: [screenshot] },
    );
    expect(mockToastSuccess).toHaveBeenCalledWith(
      SENTRY_USER_FEEDBACK_SUCCESS_TOAST_MESSAGE,
    );
  });

  it("sends feedback with a custom feedback_source tag when provided", async () => {
    await expect(
      submitSentryUserFeedback(
        {
          message: "Wrong filters",
          name: "",
          email: "",
        },
        undefined,
        { feedbackSourceTag: SENTRY_COLLECTION_COMMAND_FEEDBACK_SOURCE_TAG },
      ),
    ).resolves.toBe(true);

    expect(mockCaptureFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: {
          feedback_source: SENTRY_COLLECTION_COMMAND_FEEDBACK_SOURCE_TAG,
        },
      }),
      { includeReplay: true },
    );
  });

  it("sends feedback with replay and user_menu tag", async () => {
    await expect(
      submitSentryUserFeedback({
        message: " Playback failed ",
        name: " Wade ",
        email: " wade@example.com ",
      }),
    ).resolves.toBe(true);

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
    expect(mockNotifyBugReportReceiptAfterSubmit).toHaveBeenCalledWith(
      {
        message: " Playback failed ",
        name: " Wade ",
        email: " wade@example.com ",
      },
      "user_menu",
    );
  });

  it("does not enqueue receipt email when Sentry delivery fails", async () => {
    mockDeliverSentryClientCapture.mockResolvedValue(false);

    await expect(
      submitSentryUserFeedback({
        message: "No delivery",
        name: "",
        email: "",
      }),
    ).resolves.toBe(false);

    expect(mockNotifyBugReportReceiptAfterSubmit).not.toHaveBeenCalled();
  });
});
