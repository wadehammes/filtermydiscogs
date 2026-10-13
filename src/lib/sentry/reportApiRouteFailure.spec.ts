import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import type { reportTaggedAppError } from "src/lib/sentry/reportTaggedAppError.server";
import { getMockedExport } from "src/tests/mocks/getMockedExport";

jest.mock("src/lib/sentry/reportTaggedAppError.server", () => ({
  reportTaggedAppError: jest.fn(),
}));

const mockReportTaggedAppError = getMockedExport<typeof reportTaggedAppError>(
  "src/lib/sentry/reportTaggedAppError.server",
  "reportTaggedAppError",
);

describe("reportApiRouteFailure", () => {
  let reportApiRouteFailure: typeof import("src/lib/sentry/reportApiRouteFailure").reportApiRouteFailure;

  beforeAll(async () => {
    ({ reportApiRouteFailure } = await import(
      "src/lib/sentry/reportApiRouteFailure"
    ));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("when status is 4xx, does not report", () => {
    reportApiRouteFailure("/api/crates", new Error("nope"), { status: 404 });

    expect(mockReportTaggedAppError).not.toHaveBeenCalled();
  });

  it("when status is 5xx, tags api route, httpStatus, and user.visible false", () => {
    const error = new Error("db down");

    reportApiRouteFailure("/api/crates/[id]", error, {
      status: 503,
      extra: { code: "DB_CONNECTION_ERROR" },
    });

    expect(mockReportTaggedAppError).toHaveBeenCalledWith(
      {
        "api.route": "/api/crates/[id]",
        httpStatus: "503",
        "user.visible": "false",
      },
      error,
      {
        extra: {
          code: "DB_CONNECTION_ERROR",
          httpStatus: 503,
        },
      },
    );
  });
});
