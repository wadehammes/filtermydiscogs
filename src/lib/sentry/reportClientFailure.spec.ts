import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import type { reportTaggedAppError } from "src/lib/sentry/reportTaggedAppError.client";
import { getMockedExport } from "src/tests/mocks/getMockedExport";

jest.mock("src/lib/sentry/reportTaggedAppError.client", () => ({
  reportTaggedAppError: jest.fn(),
}));

const mockReportTaggedAppError = getMockedExport<typeof reportTaggedAppError>(
  "src/lib/sentry/reportTaggedAppError.client",
  "reportTaggedAppError",
);

describe("reportClientFailure", () => {
  let reportClientFailure: typeof import("src/lib/sentry/reportClientFailure").reportClientFailure;

  beforeAll(async () => {
    ({ reportClientFailure } = await import(
      "src/lib/sentry/reportClientFailure"
    ));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("tags error_boundary failures as user-visible", () => {
    const error = new Error("render blew up");

    reportClientFailure("error_boundary", error, { logLabel: "page" });

    expect(mockReportTaggedAppError).toHaveBeenCalledWith(
      {
        "client.domain": "error_boundary",
        "user.visible": "true",
      },
      error,
      expect.objectContaining({
        gateHttpStatusFromError: true,
        extra: { logLabel: "page" },
      }),
    );
  });

  it("tags dashboard segment failures as not user-visible by default", () => {
    reportClientFailure("dashboard", new Error("value"), {
      segment: "collection_value",
    });

    expect(mockReportTaggedAppError).toHaveBeenCalledWith(
      expect.objectContaining({
        "client.domain": "dashboard",
        "user.visible": "false",
      }),
      expect.any(Error),
      expect.any(Object),
    );
  });
});
