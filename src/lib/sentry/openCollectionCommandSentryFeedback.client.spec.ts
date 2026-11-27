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

describe("openCollectionCommandSentryFeedback", () => {
  let openCollectionCommandSentryFeedback: typeof import("src/lib/sentry/openCollectionCommandSentryFeedback.client").openCollectionCommandSentryFeedback;

  beforeAll(async () => {
    ({ openCollectionCommandSentryFeedback } = await import(
      "src/lib/sentry/openCollectionCommandSentryFeedback.client"
    ));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens user feedback with collection command context and collection_command tag", () => {
    const preview = {
      matchCount: 5,
      facts: [{ label: "Year", value: "2025" }],
    };

    openCollectionCommandSentryFeedback({
      prompt: "techno this year",
      preview,
    });

    expect(mockOpenSentryUserFeedbackDialog).toHaveBeenCalledWith({
      collectionCommandContext: {
        prompt: "techno this year",
        preview,
      },
      feedbackSourceTag: "collection_command",
    });
  });
});
