import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const getFeedback = jest.fn();
const resolveSentryEnabled = jest.fn<() => boolean>();

jest.mock("@sentry/react", () => ({
  getFeedback,
}));

jest.mock("src/lib/sentry/sentryInitOptions", () => ({
  resolveSentryEnabled,
}));

describe("openSentryUserFeedback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resolveSentryEnabled.mockReturnValue(true);
  });

  it("when Sentry is disabled, does not open the feedback form", async () => {
    resolveSentryEnabled.mockReturnValue(false);
    const { openSentryUserFeedback } = await import(
      "src/lib/sentry/openSentryUserFeedback.client"
    );

    await openSentryUserFeedback();

    expect(getFeedback).not.toHaveBeenCalled();
  });

  it("when feedback is available, opens the Sentry form", async () => {
    const open = jest.fn();
    const appendToDom = jest.fn();
    getFeedback.mockReturnValue({
      createForm: jest.fn(async () => ({
        appendToDom,
        open,
      })),
    });

    const { openSentryUserFeedback } = await import(
      "src/lib/sentry/openSentryUserFeedback.client"
    );

    await openSentryUserFeedback();

    expect(appendToDom).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledTimes(1);
  });
});
