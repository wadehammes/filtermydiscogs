import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { SentryUserFeedbackDialogPageObject } from "src/components/SentryUserFeedbackDialog/SentryUserFeedbackDialog.po";
import {
  SENTRY_USER_FEEDBACK_ADD_SCREENSHOT_LABEL,
  SENTRY_USER_FEEDBACK_CHOOSE_IMAGE_LABEL,
} from "src/constants/sentryUserFeedbackForm.constants";
import { screen, waitFor } from "test-utils";

let po: SentryUserFeedbackDialogPageObject;

describe("SentryUserFeedbackDialog", () => {
  beforeEach(() => {
    po = new SentryUserFeedbackDialogPageObject();
    jest.clearAllMocks();
  });

  it("when Send bug report is submitted with a message, forwards feedback and closes", async () => {
    const user = userEvent.setup();
    const onSubmitFeedback = jest.fn();
    const onClose = jest.fn();

    po.renderSentryUserFeedbackDialog({ onClose, onSubmitFeedback });

    await user.type(
      screen.getByLabelText("What went wrong?"),
      "Filters stopped updating",
    );
    await user.click(screen.getByRole("button", { name: "Send bug report" }));

    expect(onSubmitFeedback).toHaveBeenCalledWith(
      {
        message: "Filters stopped updating",
        name: "",
        email: "",
      },
      undefined,
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("when Send bug report is clicked without a message, shows validation", async () => {
    const user = userEvent.setup();

    po.renderSentryUserFeedbackDialog({
      onClose: jest.fn(),
      onSubmitFeedback: jest.fn(),
    });

    await user.click(screen.getByRole("button", { name: "Send bug report" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Describe what went wrong",
    );
  });

  it("when screen capture is unavailable, shows upload only", () => {
    po.renderSentryUserFeedbackDialog({ screenshotCaptureSupported: false });

    expect(
      screen.queryByRole("button", {
        name: SENTRY_USER_FEEDBACK_ADD_SCREENSHOT_LABEL,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: SENTRY_USER_FEEDBACK_CHOOSE_IMAGE_LABEL,
      }),
    ).toBeInTheDocument();
  });

  it("when a screenshot is attached and submitted, forwards the attachment", async () => {
    const user = userEvent.setup();
    const onSubmitFeedback = jest.fn();
    const screenshot = {
      data: new Uint8Array([1, 2, 3]),
      filename: "screenshot.png",
      contentType: "image/png",
    };
    const onCaptureScreenshot = jest.fn(async () => screenshot);

    po.renderSentryUserFeedbackDialog({
      onSubmitFeedback,
      onClose: jest.fn(),
      onCaptureScreenshot,
      screenshotCaptureSupported: true,
    });

    await user.click(
      screen.getByRole("button", {
        name: SENTRY_USER_FEEDBACK_ADD_SCREENSHOT_LABEL,
      }),
    );

    await waitFor(() => {
      expect(onCaptureScreenshot).toHaveBeenCalledTimes(1);
    });

    await user.type(screen.getByLabelText("What went wrong?"), "Layout bug");
    await user.click(screen.getByRole("button", { name: "Send bug report" }));

    expect(onSubmitFeedback).toHaveBeenCalledWith(
      {
        message: "Layout bug",
        name: "",
        email: "",
      },
      screenshot,
    );
  });

  it("when dialog closes and reopens, clears the message field", async () => {
    const user = userEvent.setup();
    const { rerender } = po.renderSentryUserFeedbackDialog({
      open: true,
      onClose: jest.fn(),
      onSubmitFeedback: jest.fn(),
    });

    await user.type(screen.getByLabelText("What went wrong?"), "Stale state");

    po.rerenderSentryUserFeedbackDialog(rerender, { open: false });
    po.rerenderSentryUserFeedbackDialog(rerender, { open: true });

    expect(screen.getByLabelText("What went wrong?")).toHaveValue("");
  });
});
