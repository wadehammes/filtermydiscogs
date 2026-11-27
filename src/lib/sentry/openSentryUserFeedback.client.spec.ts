import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { getMockedExport } from "src/tests/mocks/getMockedExport";
import type { openSentryUserFeedbackDialog } from "src/utils/sentryUserFeedbackDialogBridge";

jest.mock("src/utils/sentryUserFeedbackDialogBridge", () => ({
  openSentryUserFeedbackDialog: jest.fn(),
}));

const mockOpenSentryUserFeedbackDialog = getMockedExport<
  typeof openSentryUserFeedbackDialog
>("src/utils/sentryUserFeedbackDialogBridge", "openSentryUserFeedbackDialog");

describe("openSentryUserFeedback", () => {
  let openSentryUserFeedback: typeof import("src/lib/sentry/openSentryUserFeedback.client").openSentryUserFeedback;

  beforeAll(async () => {
    ({ openSentryUserFeedback } = await import(
      "src/lib/sentry/openSentryUserFeedback.client"
    ));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens the app feedback dialog", () => {
    openSentryUserFeedback();

    expect(mockOpenSentryUserFeedbackDialog).toHaveBeenCalledTimes(1);
  });
});
