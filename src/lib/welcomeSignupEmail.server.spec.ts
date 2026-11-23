import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockEmailsSend =
  jest.fn<
    (input: Record<string, unknown>) => Promise<{
      data: { id: string } | null;
      error?: { message: string; name: string };
    }>
  >();
const mockGetResendClient = jest.fn();
const mockGetResendFromEmail = jest.fn<() => string | null>();

jest.mock("src/lib/resend.server", () => ({
  getResendClient: () => mockGetResendClient(),
  getResendFromEmail: () => mockGetResendFromEmail(),
}));

const mockRenderWelcomeSignupEmail =
  jest.fn<
    (input: { username: string }) => Promise<{
      subject: string;
      html: string;
      text: string;
    }>
  >();

jest.mock("src/lib/renderWelcomeSignupEmail.server", () => ({
  renderWelcomeSignupEmail: mockRenderWelcomeSignupEmail,
}));

const mockReportTaggedAppError = jest.fn();

jest.mock("src/lib/sentry/reportTaggedAppError.server", () => ({
  reportTaggedAppError: mockReportTaggedAppError,
}));

jest.mock("src/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

type DbModule = typeof import("src/lib/db");

let mockFindUnique: jest.MockedFunction<
  DbModule["prisma"]["user"]["findUnique"]
>;
let mockUpdateMany: jest.MockedFunction<
  DbModule["prisma"]["user"]["updateMany"]
>;
let mockUpdate: jest.MockedFunction<DbModule["prisma"]["user"]["update"]>;

let sendWelcomeSignupEmailIfEligible: typeof import("src/lib/welcomeSignupEmail.server").sendWelcomeSignupEmailIfEligible;

const discogsUserId = 42;

beforeEach(async () => {
  jest.resetModules();
  mockEmailsSend.mockReset();
  mockGetResendClient.mockReset();
  mockGetResendFromEmail.mockReset();

  const db = (await import("src/lib/db")) as DbModule;
  mockFindUnique = jest.mocked(db.prisma.user.findUnique);
  mockUpdateMany = jest.mocked(db.prisma.user.updateMany);
  mockUpdate = jest.mocked(db.prisma.user.update);
  mockFindUnique.mockReset();
  mockUpdateMany.mockReset();
  mockUpdate.mockReset();

  mockGetResendClient.mockReturnValue({
    emails: { send: mockEmailsSend },
  });
  mockGetResendFromEmail.mockReturnValue(
    "FilterMyDisco.gs <onboarding@filtermydisco.gs>",
  );
  mockEmailsSend.mockResolvedValue({ data: { id: "msg-1" } });
  mockReportTaggedAppError.mockReset();
  mockRenderWelcomeSignupEmail.mockReset();
  mockRenderWelcomeSignupEmail.mockImplementation(async () => ({
    subject: "Welcome to FilterMyDisco.gs",
    html: "<p>welcome</p>",
    text: "welcome",
  }));
  mockFindUnique.mockResolvedValue({
    email: "dig@example.com",
    username: "crate-digger",
    welcome_email_sent: false,
    login_count: 1,
    created_at: new Date("2026-11-22T18:00:00.000Z"),
  } as unknown as Awaited<
    ReturnType<DbModule["prisma"]["user"]["findUnique"]>
  >);
  mockUpdateMany.mockResolvedValue({ count: 1 });
  mockUpdate.mockResolvedValue(
    {} as Awaited<ReturnType<DbModule["prisma"]["user"]["update"]>>,
  );

  const module = await import("src/lib/welcomeSignupEmail.server");
  sendWelcomeSignupEmailIfEligible = module.sendWelcomeSignupEmailIfEligible;
});

describe("sendWelcomeSignupEmailIfEligible", () => {
  it("claims the send slot, delivers mail, and leaves welcome_email_sent set", async () => {
    await sendWelcomeSignupEmailIfEligible(discogsUserId);

    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          discogs_user_id: discogsUserId,
          welcome_email_sent: false,
          email: { not: null },
        }),
        data: {
          welcome_email_sent: true,
        },
      }),
    );
    expect(mockEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "dig@example.com",
        from: "FilterMyDisco.gs <onboarding@filtermydisco.gs>",
        subject: expect.stringContaining("Welcome"),
      }),
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("does not send when welcome_email_sent is already true", async () => {
    mockFindUnique.mockResolvedValue({
      email: "dig@example.com",
      username: "crate-digger",
      welcome_email_sent: true,
      login_count: 1,
      created_at: new Date("2026-11-22T18:00:00.000Z"),
    } as unknown as Awaited<
      ReturnType<DbModule["prisma"]["user"]["findUnique"]>
    >);

    await sendWelcomeSignupEmailIfEligible(discogsUserId);

    expect(mockUpdateMany).not.toHaveBeenCalled();
    expect(mockEmailsSend).not.toHaveBeenCalled();
  });

  it("does not send when there is no email address", async () => {
    mockFindUnique.mockResolvedValue({
      email: null,
      username: "crate-digger",
      welcome_email_sent: false,
      login_count: 1,
      created_at: new Date("2026-11-22T18:00:00.000Z"),
    } as unknown as Awaited<
      ReturnType<DbModule["prisma"]["user"]["findUnique"]>
    >);

    await sendWelcomeSignupEmailIfEligible(discogsUserId);

    expect(mockUpdateMany).not.toHaveBeenCalled();
    expect(mockEmailsSend).not.toHaveBeenCalled();
  });

  it("does not send when Resend is not configured", async () => {
    mockGetResendClient.mockReturnValue(null);

    await sendWelcomeSignupEmailIfEligible(discogsUserId);

    expect(mockUpdateMany).not.toHaveBeenCalled();
    expect(mockEmailsSend).not.toHaveBeenCalled();
    expect(mockReportTaggedAppError).toHaveBeenCalled();
  });

  it("sends for a returning account when welcome was never sent", async () => {
    mockFindUnique.mockResolvedValue({
      email: "dig@example.com",
      username: "crate-digger",
      welcome_email_sent: false,
      created_at: new Date("2026-11-22T18:00:00.000Z"),
    } as unknown as Awaited<
      ReturnType<DbModule["prisma"]["user"]["findUnique"]>
    >);

    await sendWelcomeSignupEmailIfEligible(discogsUserId);

    expect(mockUpdateMany).toHaveBeenCalled();
    expect(mockEmailsSend).toHaveBeenCalled();
  });

  it("does not send for accounts created before the rollout cutoff", async () => {
    mockFindUnique.mockResolvedValue({
      email: "dig@example.com",
      username: "crate-digger",
      welcome_email_sent: false,
      login_count: 1,
      created_at: new Date("2020-01-01T00:00:00.000Z"),
    } as unknown as Awaited<
      ReturnType<DbModule["prisma"]["user"]["findUnique"]>
    >);

    await sendWelcomeSignupEmailIfEligible(discogsUserId);

    expect(mockUpdateMany).not.toHaveBeenCalled();
    expect(mockEmailsSend).not.toHaveBeenCalled();
  });

  it("does not send when another login already claimed the slot", async () => {
    mockUpdateMany.mockResolvedValue({ count: 0 });

    await sendWelcomeSignupEmailIfEligible(discogsUserId);

    expect(mockEmailsSend).not.toHaveBeenCalled();
  });

  it("clears welcome_email_sent when delivery fails", async () => {
    mockEmailsSend.mockRejectedValue(new Error("Resend down"));

    await expect(
      sendWelcomeSignupEmailIfEligible(discogsUserId),
    ).rejects.toThrow("Resend down");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { discogs_user_id: discogsUserId },
      data: { welcome_email_sent: false },
    });
  });

  it("clears welcome_email_sent when Resend returns an error without throwing", async () => {
    mockEmailsSend.mockResolvedValue({
      data: null,
      error: { message: "Domain not verified", name: "validation_error" },
    });

    await expect(
      sendWelcomeSignupEmailIfEligible(discogsUserId),
    ).rejects.toThrow("Domain not verified");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { discogs_user_id: discogsUserId },
      data: { welcome_email_sent: false },
    });
  });
});
