import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import type { reportTaggedAppError } from "src/lib/sentry/reportTaggedAppError.server";
import type { shouldCaptureInfrastructureFailure } from "src/lib/sentry/shouldCaptureInfrastructureFailure";
import { getMockedExport } from "src/tests/mocks/getMockedExport";

jest.mock("src/lib/sentry/reportTaggedAppError.server", () => ({
  reportTaggedAppError: jest.fn(),
}));

jest.mock("src/lib/sentry/shouldCaptureInfrastructureFailure", () => ({
  shouldCaptureInfrastructureFailure: jest.fn(),
}));

const mockReportTaggedAppError = getMockedExport<typeof reportTaggedAppError>(
  "src/lib/sentry/reportTaggedAppError.server",
  "reportTaggedAppError",
);

const mockShouldCaptureInfrastructureFailure = getMockedExport<
  typeof shouldCaptureInfrastructureFailure
>(
  "src/lib/sentry/shouldCaptureInfrastructureFailure",
  "shouldCaptureInfrastructureFailure",
);

describe("reportInfrastructureFailure", () => {
  let reportInfrastructureFailure: typeof import("src/lib/sentry/reportInfrastructureFailure").reportInfrastructureFailure;

  beforeAll(async () => {
    ({ reportInfrastructureFailure } = await import(
      "src/lib/sentry/reportInfrastructureFailure"
    ));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockShouldCaptureInfrastructureFailure.mockReturnValue(true);
  });

  it("does not report when infrastructure capture is gated off", () => {
    mockShouldCaptureInfrastructureFailure.mockReturnValue(false);

    reportInfrastructureFailure("database", new Error("pool"), {
      source: "pool",
    });

    expect(mockReportTaggedAppError).not.toHaveBeenCalled();
  });

  it("reports with infrastructure tags when capture is allowed", () => {
    const error = new Error("pool");

    reportInfrastructureFailure("database", error, { source: "pool" });

    expect(mockReportTaggedAppError).toHaveBeenCalledWith(
      {
        "infrastructure.area": "database",
        "user.visible": "false",
      },
      error,
      { extra: { source: "pool" } },
    );
  });
});
