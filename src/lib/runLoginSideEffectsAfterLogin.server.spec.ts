import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { DiscogsProfileEmailCredentials } from "src/lib/discogs-profile-email.server";

const mockBackfillUserEmailFromDiscogsProfileIfEmpty =
  jest.fn<
    (
      discogsUserId: number,
      credentials: DiscogsProfileEmailCredentials,
      routeLabel: string,
    ) => Promise<void>
  >();
const mockSendWelcomeSignupEmailIfEligible =
  jest.fn<(discogsUserId: number) => Promise<void>>();

jest.mock("src/lib/backfillUserEmailFromDiscogsProfile.server", () => ({
  backfillUserEmailFromDiscogsProfileIfEmpty:
    mockBackfillUserEmailFromDiscogsProfileIfEmpty,
}));

jest.mock("src/lib/welcomeSignupEmail.server", () => ({
  sendWelcomeSignupEmailIfEligible: mockSendWelcomeSignupEmailIfEligible,
}));

const credentials = {
  username: "crate-digger",
  accessToken: "token",
  accessTokenSecret: "secret",
};

let runLoginSideEffectsAfterLogin: typeof import("src/lib/runLoginSideEffectsAfterLogin.server").runLoginSideEffectsAfterLogin;

beforeEach(async () => {
  jest.resetModules();
  mockBackfillUserEmailFromDiscogsProfileIfEmpty.mockReset();
  mockSendWelcomeSignupEmailIfEligible.mockReset();
  mockBackfillUserEmailFromDiscogsProfileIfEmpty.mockResolvedValue(undefined);
  mockSendWelcomeSignupEmailIfEligible.mockResolvedValue(undefined);

  const module = await import("src/lib/runLoginSideEffectsAfterLogin.server");
  runLoginSideEffectsAfterLogin = module.runLoginSideEffectsAfterLogin;
});

describe("runLoginSideEffectsAfterLogin", () => {
  it("when OAuth credentials are provided, backfills email before sending welcome mail", async () => {
    const callOrder: string[] = [];
    mockBackfillUserEmailFromDiscogsProfileIfEmpty.mockImplementation(
      async () => {
        callOrder.push("backfill");
      },
    );
    mockSendWelcomeSignupEmailIfEligible.mockImplementation(async () => {
      callOrder.push("welcome");
    });

    await runLoginSideEffectsAfterLogin(42, "/api/auth/callback", credentials);

    expect(mockBackfillUserEmailFromDiscogsProfileIfEmpty).toHaveBeenCalledWith(
      42,
      credentials,
      "/api/auth/callback",
    );
    expect(mockSendWelcomeSignupEmailIfEligible).toHaveBeenCalledWith(42);
    expect(callOrder).toEqual(["backfill", "welcome"]);
  });
});
