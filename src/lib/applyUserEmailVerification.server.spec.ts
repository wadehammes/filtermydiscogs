import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

jest.mock("src/lib/db", () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("src/lib/welcomeSignupEmail.server", () => ({
  sendWelcomeSignupEmailIfEligible: jest.fn(async () => undefined),
}));

jest.mock("src/lib/api-helpers", () => ({
  logSanitizedApiRouteFailure: jest.fn(),
}));

type DbModule = typeof import("src/lib/db");

let mockFindFirst: jest.MockedFunction<DbModule["prisma"]["user"]["findFirst"]>;
let mockUpdate: jest.MockedFunction<DbModule["prisma"]["user"]["update"]>;
let mockSendWelcomeSignupEmailIfEligible: jest.MockedFunction<
  typeof import("src/lib/welcomeSignupEmail.server")["sendWelcomeSignupEmailIfEligible"]
>;
let applyUserEmailVerificationToken: typeof import("src/lib/applyUserEmailVerification.server")["applyUserEmailVerificationToken"];

beforeAll(async () => {
  const db = await import("src/lib/db");
  mockFindFirst = jest.mocked(db.prisma.user.findFirst);
  mockUpdate = jest.mocked(db.prisma.user.update);
  const welcomeEmail = await import("src/lib/welcomeSignupEmail.server");
  mockSendWelcomeSignupEmailIfEligible = jest.mocked(
    welcomeEmail.sendWelcomeSignupEmailIfEligible,
  );
  const module = await import("src/lib/applyUserEmailVerification.server");
  applyUserEmailVerificationToken = module.applyUserEmailVerificationToken;
});

describe("applyUserEmailVerificationToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockResolvedValue({} as never);
    mockSendWelcomeSignupEmailIfEligible.mockResolvedValue(undefined);
  });

  it("promotes the pending address and clears the challenge", async () => {
    mockFindFirst.mockResolvedValue({
      discogs_user_id: 42,
      email_pending: "new@example.com",
      email_verification_expires_at: new Date("2099-01-01T00:00:00.000Z"),
    } as never);

    const result = await applyUserEmailVerificationToken("hash");

    expect(result).toEqual({ ok: true });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { discogs_user_id: 42 },
      data: {
        email: "new@example.com",
        email_pending: null,
        email_verified_at: expect.any(Date),
        email_verification_token_hash: null,
        email_verification_expires_at: null,
      },
    });
  });

  it("returns expired when the challenge is past its window", async () => {
    mockFindFirst.mockResolvedValue({
      discogs_user_id: 42,
      email_pending: "new@example.com",
      email_verification_expires_at: new Date("2000-01-01T00:00:00.000Z"),
    } as never);

    const result = await applyUserEmailVerificationToken("hash");

    expect(result).toEqual({ ok: false, reason: "expired" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
