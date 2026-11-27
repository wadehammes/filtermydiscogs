import { afterEach, describe, expect, it, jest } from "@jest/globals";
import {
  openSentryUserFeedbackDialog,
  registerSentryUserFeedbackDialogOpen,
} from "src/utils/sentryUserFeedbackDialogBridge";

describe("sentryUserFeedbackDialogBridge", () => {
  let unregisterOpen: (() => void) | undefined;

  afterEach(() => {
    unregisterOpen?.();
    unregisterOpen = undefined;
  });

  it("forwards open to the registered handler", () => {
    const onOpen = jest.fn();
    unregisterOpen = registerSentryUserFeedbackDialogOpen(onOpen);

    openSentryUserFeedbackDialog();

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith({});

    unregisterOpen();
    onOpen.mockClear();

    openSentryUserFeedbackDialog();

    expect(onOpen).not.toHaveBeenCalled();
  });

  it("forwards optional dialog request fields to the registered handler", () => {
    const onOpen = jest.fn();
    unregisterOpen = registerSentryUserFeedbackDialogOpen(onOpen);

    openSentryUserFeedbackDialog({
      defaultMessage: "Prefilled",
      feedbackSourceTag: "collection_command",
    });

    expect(onOpen).toHaveBeenCalledWith({
      defaultMessage: "Prefilled",
      feedbackSourceTag: "collection_command",
    });
  });
});
