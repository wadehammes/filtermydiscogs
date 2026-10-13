import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import type { reportClientFailure } from "src/lib/sentry/reportClientFailure";
import { getMockedExport } from "src/tests/mocks/getMockedExport";

jest.mock("src/lib/sentry/reportClientFailure", () => ({
  reportClientFailure: jest.fn(),
}));

const mockReportClientFailure = getMockedExport<typeof reportClientFailure>(
  "src/lib/sentry/reportClientFailure",
  "reportClientFailure",
);

describe("reportMosaicFailureToSentry", () => {
  let reportMosaicFailureToSentry: typeof import("src/lib/sentry/reportMosaicFailure").reportMosaicFailureToSentry;

  beforeAll(async () => {
    ({ reportMosaicFailureToSentry } = await import(
      "src/lib/sentry/reportMosaicFailure"
    ));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reports mosaic failures through reportClientFailure with warning grouping", () => {
    const error = new Error("canvas OOM");

    reportMosaicFailureToSentry(error, { releaseCount: 12 });

    expect(mockReportClientFailure).toHaveBeenCalledWith(
      "mosaic",
      error,
      { releaseCount: 12 },
      {
        level: "warning",
        fingerprint: ["client-mosaic-failure"],
      },
    );
  });
});
