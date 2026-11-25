import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockGetResendClient = jest.fn();
const mockGetResendFromEmail = jest.fn<() => string | null>();
const mockSendResendEmail =
  jest.fn<
    (
      resend: unknown,
      input: {
        from: string;
        to: string;
        subject: string;
        text: string;
        html: string;
      },
    ) => Promise<void>
  >();

jest.mock("src/lib/resend.server", () => ({
  getResendClient: () => mockGetResendClient(),
  getResendFromEmail: () => mockGetResendFromEmail(),
  sendResendEmail: (
    resend: unknown,
    input: {
      from: string;
      to: string;
      subject: string;
      text: string;
      html: string;
    },
  ) => mockSendResendEmail(resend, input),
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
const resendClientStub = { emails: { send: jest.fn() } };

beforeEach(async () => {
  jest.resetModules();
  mockGetResendClient.mockReset();
  mockGetResendFromEmail.mockReset();
  mockSendResendEmail.mockReset();

  const db = (await import("src/lib/db")) as DbModule;
  mockFindUnique = jest.mocked(db.prisma.user.findUnique);
  mockUpdateMany = jest.mocked(db.prisma.user.updateMany);
  mockUpdate = jest.mocked(db.prisma.user.update);
  mockFindUnique.mockReset();
  mockUpdateMany.mockReset();
  mockUpdate.mockReset();

  mockGetResendClient.mockReturnValue(resendClientStub);
  mockGetResendFromEmail.mockReturnValue(
    "FilterMyDisco.gs <no-reply@updates.filtermydisco.gs>",
  );
  mockSendResendEmail.mockResolvedValue(undefined);
  mockReportTaggedAppError.mockReset();
  mockRenderWelcomeSignupEmail.mockReset();
  mockRenderWelcomeSignupEmail.mockImplementation(async () => ({
    subject: "Welcome to FilterMyDisco.gs",
    html: "<p>welcome</p>",
    text: "welcome",
  }));
  mockFindUnique.mockResolvedValue({
    email: "dig@example.com",
    email_verified_at: new Date("2026-11-22T18:00:00.000Z"),
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
    expect(mockSendResendEmail).toHaveBeenCalledWith(
      resendClientStub,
      expect.objectContaining({
        to: "dig@example.com",
        from: "FilterMyDisco.gs <no-reply@updates.filtermydisco.gs>",
        subject: expect.stringContaining("Welcome"),
      }),
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("does not send when welcome_email_sent is already true", async () => {
    mockFindUnique.mockResolvedValue({
      email: "dig@example.com",
      username: "crate-digger",
      email_verified_at: new Date("2026-11-22T18:00:00.000Z"),
      welcome_email_sent: true,
      login_count: 1,
      created_at: new Date("2026-11-22T18:00:00.000Z"),
    } as unknown as Awaited<
      ReturnType<DbModule["prisma"]["user"]["findUnique"]>
    >);

    await sendWelcomeSignupEmailIfEligible(discogsUserId);

    expect(mockUpdateMany).not.toHaveBeenCalled();
    expect(mockSendResendEmail).not.toHaveBeenCalled();
  });

  it("does not send when there is no email address", async () => {
    mockFindUnique.mockResolvedValue({
      email: null,
      username: "crate-digger",
      email_verified_at: null,
      welcome_email_sent: false,
      login_count: 1,
      created_at: new Date("2026-11-22T18:00:00.000Z"),
    } as unknown as Awaited<
      ReturnType<DbModule["prisma"]["user"]["findUnique"]>
    >);

    await sendWelcomeSignupEmailIfEligible(discogsUserId);

    expect(mockUpdateMany).not.toHaveBeenCalled();
    expect(mockSendResendEmail).not.toHaveBeenCalled();
  });

  it("does not send when the email address is not verified", async () => {
    mockFindUnique.mockResolvedValue({
      email: "dig@example.com",
      email_verified_at: null,
      username: "crate-digger",
      welcome_email_sent: false,
      login_count: 1,
      created_at: new Date("2026-11-22T18:00:00.000Z"),
    } as unknown as Awaited<
      ReturnType<DbModule["prisma"]["user"]["findUnique"]>
    >);

    await sendWelcomeSignupEmailIfEligible(discogsUserId);

    expect(mockUpdateMany).not.toHaveBeenCalled();
    expect(mockSendResendEmail).not.toHaveBeenCalled();
  });

  it("does not send when Resend is not configured", async () => {
    mockGetResendClient.mockReturnValue(null);

    await sendWelcomeSignupEmailIfEligible(discogsUserId);

    expect(mockUpdateMany).not.toHaveBeenCalled();
    expect(mockSendResendEmail).not.toHaveBeenCalled();
    expect(mockReportTaggedAppError).toHaveBeenCalled();
  });

  it("sends for a returning account when welcome was never sent", async () => {
    mockFindUnique.mockResolvedValue({
      email: "dig@example.com",
      username: "crate-digger",
      email_verified_at: new Date("2026-11-22T18:00:00.000Z"),
      welcome_email_sent: false,
      created_at: new Date("2026-11-22T18:00:00.000Z"),
    } as unknown as Awaited<
      ReturnType<DbModule["prisma"]["user"]["findUnique"]>
    >);

    await sendWelcomeSignupEmailIfEligible(discogsUserId);

    expect(mockUpdateMany).toHaveBeenCalled();
    expect(mockSendResendEmail).toHaveBeenCalled();
  });

  it("does not send for accounts created before the rollout cutoff", async () => {
    mockFindUnique.mockResolvedValue({
      email: "dig@example.com",
      email_verified_at: new Date("2020-01-01T00:00:00.000Z"),
      username: "crate-digger",
      welcome_email_sent: false,
      login_count: 1,
      created_at: new Date("2020-01-01T00:00:00.000Z"),
    } as unknown as Awaited<
      ReturnType<DbModule["prisma"]["user"]["findUnique"]>
    >);

    await sendWelcomeSignupEmailIfEligible(discogsUserId);

    expect(mockUpdateMany).not.toHaveBeenCalled();
    expect(mockSendResendEmail).not.toHaveBeenCalled();
  });

  it("does not send when another login already claimed the slot", async () => {
    mockUpdateMany.mockResolvedValue({ count: 0 });

    await sendWelcomeSignupEmailIfEligible(discogsUserId);

    expect(mockSendResendEmail).not.toHaveBeenCalled();
  });

  it("clears welcome_email_sent when delivery fails", async () => {
    mockSendResendEmail.mockRejectedValue(new Error("Resend down"));

    await expect(
      sendWelcomeSignupEmailIfEligible(discogsUserId),
    ).rejects.toThrow("Resend down");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { discogs_user_id: discogsUserId },
      data: { welcome_email_sent: false },
    });
  });
});
