import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import type { syncSentryUser } from "src/lib/sentry/syncSentryUser.client";
import { getMockedExport } from "src/tests/mocks/getMockedExport";
import {
  testAuthenticatedAuthState,
  testUnauthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { renderFeatureHook, waitFor } from "test-utils";

jest.mock("src/lib/sentry/syncSentryUser.client", () => ({
  syncSentryUser: jest.fn(),
}));

const mockSyncSentryUser = getMockedExport<typeof syncSentryUser>(
  "src/lib/sentry/syncSentryUser.client",
  "syncSentryUser",
);

describe("useSentryUserSync", () => {
  let useSentryUserSync: typeof import("src/hooks/useSentryUserSync.hook").useSentryUserSync;

  beforeAll(async () => {
    ({ useSentryUserSync } = await import("src/hooks/useSentryUserSync.hook"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("when authenticated, syncs discogs identity to Sentry", async () => {
    renderFeatureHook(() => useSentryUserSync(), {
      authInitialState: testAuthenticatedAuthState,
      skipInitialAuthCheck: true,
    });

    await waitFor(() => {
      expect(mockSyncSentryUser).toHaveBeenCalledWith({
        userId: testAuthenticatedAuthState.userId,
        username: testAuthenticatedAuthState.username,
      });
    });
  });

  it("when signed out, clears Sentry user", async () => {
    renderFeatureHook(() => useSentryUserSync(), {
      authInitialState: testUnauthenticatedAuthState,
      skipInitialAuthCheck: true,
    });

    await waitFor(() => {
      expect(mockSyncSentryUser).toHaveBeenCalledWith({
        userId: null,
        username: null,
      });
    });
  });
});
