import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { WELCOME_EMAIL_NEW_ACCOUNT_MIN_CREATED_AT } from "src/constants/welcomeSignupEmail.constants";

jest.mock("src/lib/db", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("src/lib/welcomeSignupEmail.server", () => ({
  sendWelcomeSignupEmailIfEligible: jest.fn(),
}));

type DbModule = typeof import("src/lib/db");

let mockFindMany: jest.MockedFunction<DbModule["prisma"]["user"]["findMany"]>;
let mockFindUnique: jest.MockedFunction<
  DbModule["prisma"]["user"]["findUnique"]
>;
let mockSendWelcome: jest.MockedFunction<
  typeof import("src/lib/welcomeSignupEmail.server")["sendWelcomeSignupEmailIfEligible"]
>;

let listAdminWelcomeEmailPendingUsers: typeof import("src/lib/admin-welcome-email-pending.server").listAdminWelcomeEmailPendingUsers;
let sendAdminWelcomeEmailForUser: typeof import("src/lib/admin-welcome-email-pending.server").sendAdminWelcomeEmailForUser;
let AdminWelcomeEmailSendFailedError: typeof import("src/lib/admin-welcome-email-pending.server").AdminWelcomeEmailSendFailedError;

const eligibleUser = {
  discogs_user_id: 42,
  username: "crate-digger",
  email: "dig@example.com",
  welcome_email_sent: false,
  created_at: new Date("2026-11-23T12:00:00.000Z"),
  login_count: 1,
};

beforeEach(async () => {
  jest.resetModules();
  const db = (await import("src/lib/db")) as DbModule;
  mockFindMany = jest.mocked(db.prisma.user.findMany);
  mockFindUnique = jest.mocked(db.prisma.user.findUnique);
  const welcome = await import("src/lib/welcomeSignupEmail.server");
  mockSendWelcome = jest.mocked(welcome.sendWelcomeSignupEmailIfEligible);
  mockFindMany.mockReset();
  mockFindUnique.mockReset();
  mockSendWelcome.mockReset();
  mockSendWelcome.mockResolvedValue(undefined);

  const module = await import("src/lib/admin-welcome-email-pending.server");
  listAdminWelcomeEmailPendingUsers = module.listAdminWelcomeEmailPendingUsers;
  sendAdminWelcomeEmailForUser = module.sendAdminWelcomeEmailForUser;
  AdminWelcomeEmailSendFailedError = module.AdminWelcomeEmailSendFailedError;
});

describe("listAdminWelcomeEmailPendingUsers", () => {
  it("returns eligible users with trimmed email and ISO createdAt", async () => {
    mockFindMany.mockResolvedValue([
      eligibleUser,
      {
        ...eligibleUser,
        discogs_user_id: 9,
        email: "  ",
        username: "no-mail",
      },
      {
        ...eligibleUser,
        discogs_user_id: 8,
        welcome_email_sent: true,
      },
      {
        ...eligibleUser,
        discogs_user_id: 7,
        created_at: new Date(
          WELCOME_EMAIL_NEW_ACCOUNT_MIN_CREATED_AT.getTime() - 1,
        ),
      },
    ] as unknown as Awaited<
      ReturnType<DbModule["prisma"]["user"]["findMany"]>
    >);

    const users = await listAdminWelcomeEmailPendingUsers();

    expect(users).toEqual([
      {
        discogsUserId: 42,
        username: "crate-digger",
        email: "dig@example.com",
        createdAt: "2026-11-23T12:00:00.000Z",
        loginCount: 1,
      },
    ]);
  });
});

describe("sendAdminWelcomeEmailForUser", () => {
  it("sends when the account becomes marked welcome_email_sent", async () => {
    mockFindUnique
      .mockResolvedValueOnce({
        email: eligibleUser.email,
        welcome_email_sent: false,
        created_at: eligibleUser.created_at,
      } as unknown as Awaited<
        ReturnType<DbModule["prisma"]["user"]["findUnique"]>
      >)
      .mockResolvedValueOnce({
        welcome_email_sent: true,
      } as unknown as Awaited<
        ReturnType<DbModule["prisma"]["user"]["findUnique"]>
      >);

    await sendAdminWelcomeEmailForUser(42);

    expect(mockSendWelcome).toHaveBeenCalledWith(42);
  });

  it("rejects ineligible accounts before calling Resend", async () => {
    mockFindUnique.mockResolvedValue({
      email: eligibleUser.email,
      welcome_email_sent: true,
      created_at: eligibleUser.created_at,
    } as unknown as Awaited<
      ReturnType<DbModule["prisma"]["user"]["findUnique"]>
    >);

    await expect(sendAdminWelcomeEmailForUser(42)).rejects.toBeInstanceOf(
      AdminWelcomeEmailSendFailedError,
    );
    expect(mockSendWelcome).not.toHaveBeenCalled();
  });

  it("rejects when welcome_email_sent stays false after send", async () => {
    mockFindUnique
      .mockResolvedValueOnce({
        email: eligibleUser.email,
        welcome_email_sent: false,
        created_at: eligibleUser.created_at,
      } as unknown as Awaited<
        ReturnType<DbModule["prisma"]["user"]["findUnique"]>
      >)
      .mockResolvedValueOnce({
        welcome_email_sent: false,
      } as unknown as Awaited<
        ReturnType<DbModule["prisma"]["user"]["findUnique"]>
      >);

    await expect(sendAdminWelcomeEmailForUser(42)).rejects.toBeInstanceOf(
      AdminWelcomeEmailSendFailedError,
    );
  });
});
