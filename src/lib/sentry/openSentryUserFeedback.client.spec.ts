import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { SENTRY_CLIENT_DELIVERY_FAILED_TOAST_MESSAGE } from "src/constants/sentryUserFeedbackForm.constants";
import type { resolveSentryEnabled } from "src/lib/sentry/sentryInitOptions";
import {
  getMockedExport,
  getMockedModule,
} from "src/tests/mocks/getMockedExport";
import type { openSentryUserFeedbackDialog } from "src/utils/sentryUserFeedbackDialogBridge";
import type { toast } from "src/utils/toast";

jest.mock("src/utils/sentryUserFeedbackDialogBridge", () => ({
  openSentryUserFeedbackDialog: jest.fn(),
}));

jest.mock("src/lib/sentry/sentryInitOptions", () => ({
  resolveSentryEnabled: jest.fn(),
}));

jest.mock("src/utils/toast", () => ({
  toast: {
    error: jest.fn(),
  },
}));

const mockOpenSentryUserFeedbackDialog = getMockedExport<
  typeof openSentryUserFeedbackDialog
>("src/utils/sentryUserFeedbackDialogBridge", "openSentryUserFeedbackDialog");

const mockResolveSentryEnabled = getMockedExport<typeof resolveSentryEnabled>(
  "src/lib/sentry/sentryInitOptions",
  "resolveSentryEnabled",
);

const mockToastError = getMockedModule<{ toast: typeof toast }>(
  "src/utils/toast",
).toast.error;

describe("openSentryUserFeedback", () => {
  let openSentryUserFeedback: typeof import("src/lib/sentry/openSentryUserFeedback.client").openSentryUserFeedback;

  beforeAll(async () => {
    ({ openSentryUserFeedback } = await import(
      "src/lib/sentry/openSentryUserFeedback.client"
    ));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockResolveSentryEnabled.mockReturnValue(true);
  });

  it("when Sentry is disabled, shows an error toast and does not open the dialog", () => {
    mockResolveSentryEnabled.mockReturnValue(false);

    openSentryUserFeedback();

    expect(mockToastError).toHaveBeenCalledWith(
      SENTRY_CLIENT_DELIVERY_FAILED_TOAST_MESSAGE,
    );
    expect(mockOpenSentryUserFeedbackDialog).not.toHaveBeenCalled();
  });

  it("when Sentry is enabled, opens the app feedback dialog", () => {
    openSentryUserFeedback();

    expect(mockOpenSentryUserFeedbackDialog).toHaveBeenCalledTimes(1);
  });
});
