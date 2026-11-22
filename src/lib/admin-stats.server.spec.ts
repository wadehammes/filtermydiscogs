import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("src/lib/db", () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

type DbModule = typeof import("src/lib/db");

let mockQueryRaw: jest.MockedFunction<DbModule["prisma"]["$queryRaw"]>;

let fetchAdminAccountContactStats: typeof import("src/lib/admin-stats.server").fetchAdminAccountContactStats;

beforeEach(async () => {
  jest.resetModules();
  const db = (await import("src/lib/db")) as DbModule;
  mockQueryRaw = jest.mocked(db.prisma.$queryRaw);
  ({ fetchAdminAccountContactStats } = await import(
    "src/lib/admin-stats.server"
  ));
});

describe("fetchAdminAccountContactStats", () => {
  it("when users have saved emails, returns contact aggregates", async () => {
    mockQueryRaw.mockResolvedValueOnce([
      {
        users_with_email: 12,
        marketing_opt_in: 4,
        welcome_email_sent: 10,
      },
    ]);

    await expect(fetchAdminAccountContactStats()).resolves.toEqual({
      usersWithEmail: 12,
      marketingOptInEnabled: 4,
      welcomeEmailSent: 10,
    });
  });

  it("when no users match, returns zero counts", async () => {
    mockQueryRaw.mockResolvedValueOnce([]);

    await expect(fetchAdminAccountContactStats()).resolves.toEqual({
      usersWithEmail: 0,
      marketingOptInEnabled: 0,
      welcomeEmailSent: 0,
    });
  });
});
