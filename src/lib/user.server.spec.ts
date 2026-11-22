import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { prismaUserFactory } from "src/tests/factories/User.factory";

jest.mock("src/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

type DbModule = typeof import("src/lib/db");

let mockFindUnique: jest.MockedFunction<
  DbModule["prisma"]["user"]["findUnique"]
>;
let mockCreate: jest.MockedFunction<DbModule["prisma"]["user"]["create"]>;
let mockUpdate: jest.MockedFunction<DbModule["prisma"]["user"]["update"]>;

let recordDiscogsLogin: typeof import("src/lib/user.server").recordDiscogsLogin;
let readSupportProjectToastEligible: typeof import("src/lib/user.server").readSupportProjectToastEligible;

beforeEach(async () => {
  jest.resetModules();
  const db = (await import("src/lib/db")) as DbModule;
  mockFindUnique = jest.mocked(db.prisma.user.findUnique);
  mockCreate = jest.mocked(db.prisma.user.create);
  mockUpdate = jest.mocked(db.prisma.user.update);
  const userServer = await import("src/lib/user.server");
  recordDiscogsLogin = userServer.recordDiscogsLogin;
  readSupportProjectToastEligible = userServer.readSupportProjectToastEligible;
});

describe("readSupportProjectToastEligible", () => {
  it("when no user row exists yet, returns true", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(readSupportProjectToastEligible(42)).resolves.toBe(true);
  });

  it("when the user dismissed the toast, returns false", async () => {
    mockFindUnique.mockResolvedValue(
      prismaUserFactory.build({
        support_toast_dismissed: true,
      }),
    );

    await expect(readSupportProjectToastEligible(42)).resolves.toBe(false);
  });

  it("when the user has not dismissed the toast, returns true", async () => {
    mockFindUnique.mockResolvedValue(
      prismaUserFactory.build({
        support_toast_dismissed: false,
      }),
    );

    await expect(readSupportProjectToastEligible(42)).resolves.toBe(true);
  });
});

describe("recordDiscogsLogin", () => {
  it("when creating a new user, does not set support toast pending", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue(prismaUserFactory.build());

    await recordDiscogsLogin({ discogsUserId: 9, username: "new-digger" });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          login_count: 1,
          support_toast_pending: false,
        }),
      }),
    );
  });

  it("when an existing user logs in, does not gate the support toast on login count", async () => {
    mockFindUnique.mockResolvedValue(
      prismaUserFactory.build({
        login_count: 1,
        support_toast_dismissed: false,
      }),
    );
    mockUpdate.mockResolvedValue(prismaUserFactory.build());

    await recordDiscogsLogin({ discogsUserId: 9, username: "new-digger" });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({
          support_toast_pending: true,
        }),
      }),
    );
  });
});
