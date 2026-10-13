import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import type { setUser } from "@sentry/react";
import type { resolveSentryEnabled } from "src/lib/sentry/sentryInitOptions";
import { getMockedExport } from "src/tests/mocks/getMockedExport";

jest.mock("@sentry/react", () => ({
  setUser: jest.fn(),
}));

jest.mock("src/lib/sentry/sentryInitOptions", () => ({
  resolveSentryEnabled: jest.fn(),
}));

const mockSetUser = getMockedExport<typeof setUser>("@sentry/react", "setUser");
const mockResolveSentryEnabled = getMockedExport<typeof resolveSentryEnabled>(
  "src/lib/sentry/sentryInitOptions",
  "resolveSentryEnabled",
);

describe("syncSentryUser", () => {
  let syncSentryUser: typeof import("src/lib/sentry/syncSentryUser.client").syncSentryUser;
  const originalEnv = process.env;

  beforeAll(async () => {
    ({ syncSentryUser } = await import("src/lib/sentry/syncSentryUser.client"));
  });

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
    mockResolveSentryEnabled.mockReturnValue(true);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("when Sentry is disabled, does not set user", () => {
    mockResolveSentryEnabled.mockReturnValue(false);

    syncSentryUser({ userId: "1", username: "dig" });

    expect(mockSetUser).not.toHaveBeenCalled();
  });

  it("sets discogs id and username on Sentry user", () => {
    syncSentryUser({ userId: "42", username: "crate-digger" });

    expect(mockSetUser).toHaveBeenCalledWith({
      id: "42",
      username: "crate-digger",
    });
  });

  it("clears Sentry user when identity is missing", () => {
    syncSentryUser({ userId: null, username: null });

    expect(mockSetUser).toHaveBeenCalledWith(null);
  });
});
