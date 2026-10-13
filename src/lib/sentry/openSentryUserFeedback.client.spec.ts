import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import type { resolveSentryEnabled } from "src/lib/sentry/sentryInitOptions";
import { getMockedExport } from "src/tests/mocks/getMockedExport";
import type { openSentryUserFeedbackDialog } from "src/utils/sentryUserFeedbackDialogBridge";

jest.mock("src/utils/sentryUserFeedbackDialogBridge", () => ({
  openSentryUserFeedbackDialog: jest.fn(),
}));

jest.mock("src/lib/sentry/sentryInitOptions", () => ({
  resolveSentryEnabled: jest.fn(),
}));

const mockOpenSentryUserFeedbackDialog = getMockedExport<
  typeof openSentryUserFeedbackDialog
>("src/utils/sentryUserFeedbackDialogBridge", "openSentryUserFeedbackDialog");

const mockResolveSentryEnabled = getMockedExport<typeof resolveSentryEnabled>(
  "src/lib/sentry/sentryInitOptions",
  "resolveSentryEnabled",
);

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

  it("when Sentry is disabled, does not open the dialog", () => {
    mockResolveSentryEnabled.mockReturnValue(false);

    openSentryUserFeedback();

    expect(mockOpenSentryUserFeedbackDialog).not.toHaveBeenCalled();
  });

  it("when Sentry is enabled, opens the app feedback dialog", () => {
    openSentryUserFeedback();

    expect(mockOpenSentryUserFeedbackDialog).toHaveBeenCalledTimes(1);
  });
});
