import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { DiscogsProfileEmailCredentials } from "src/lib/discogs-profile-email.server";
import { prismaUserFactory } from "src/tests/factories/User.factory";

const mockFetchDiscogsProfileEmailForLogin =
  jest.fn<
    (
      credentials: DiscogsProfileEmailCredentials,
      routeLabel: string,
    ) => Promise<string | null>
  >();

jest.mock("src/lib/discogs-profile-email.server", () => ({
  fetchDiscogsProfileEmailForLogin: mockFetchDiscogsProfileEmailForLogin,
}));

jest.mock("src/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

type DbModule = typeof import("src/lib/db");

let mockFindUnique: jest.MockedFunction<
  DbModule["prisma"]["user"]["findUnique"]
>;
let mockUpdate: jest.MockedFunction<DbModule["prisma"]["user"]["update"]>;

let backfillUserEmailFromDiscogsProfileIfEmpty: typeof import("src/lib/backfillUserEmailFromDiscogsProfile.server").backfillUserEmailFromDiscogsProfileIfEmpty;

const credentials = {
  username: "crate-digger",
  accessToken: "token",
  accessTokenSecret: "secret",
};

beforeEach(async () => {
  jest.resetModules();
  mockFetchDiscogsProfileEmailForLogin.mockReset();
  const db = (await import("src/lib/db")) as DbModule;
  mockFindUnique = jest.mocked(db.prisma.user.findUnique);
  mockUpdate = jest.mocked(db.prisma.user.update);
  const module = await import(
    "src/lib/backfillUserEmailFromDiscogsProfile.server"
  );
  backfillUserEmailFromDiscogsProfileIfEmpty =
    module.backfillUserEmailFromDiscogsProfileIfEmpty;
});

describe("backfillUserEmailFromDiscogsProfileIfEmpty", () => {
  it("when the user already has an email, does not call Discogs", async () => {
    mockFindUnique.mockResolvedValue(
      prismaUserFactory.build({ email: "mine@example.com" }),
    );

    await backfillUserEmailFromDiscogsProfileIfEmpty(
      9,
      credentials,
      "/api/auth/callback",
    );

    expect(mockFetchDiscogsProfileEmailForLogin).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("when the user has no email, stores the Discogs profile address", async () => {
    mockFindUnique.mockResolvedValue(prismaUserFactory.build({ email: null }));
    mockFetchDiscogsProfileEmailForLogin.mockResolvedValue(
      "discogs@example.com",
    );
    mockUpdate.mockResolvedValue(prismaUserFactory.build());

    await backfillUserEmailFromDiscogsProfileIfEmpty(
      9,
      credentials,
      "/api/auth/callback",
    );

    expect(mockFetchDiscogsProfileEmailForLogin).toHaveBeenCalledWith(
      credentials,
      "/api/auth/callback",
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { email: "discogs@example.com" },
      }),
    );
  });
});
