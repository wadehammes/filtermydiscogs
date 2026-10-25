import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("src/lib/db", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
  },
}));

type DbModule = typeof import("src/lib/db");

let resolvePublicShareUsername: typeof import("src/lib/public-share-username.server")["resolvePublicShareUsername"];
let mockUserFindUnique: jest.MockedFunction<
  DbModule["prisma"]["user"]["findUnique"]
>;

const OWNER_ID = 42;

describe("resolvePublicShareUsername", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    const [module, db] = await Promise.all([
      import("src/lib/public-share-username.server"),
      import("src/lib/db"),
    ]);
    resolvePublicShareUsername = module.resolvePublicShareUsername;
    mockUserFindUnique = jest.mocked(db.prisma.user.findUnique);
  });

  it("returns trimmed stored username when set on the share row", async () => {
    await expect(
      resolvePublicShareUsername(OWNER_ID, "  crate-digger  "),
    ).resolves.toBe("crate-digger");
    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  it("when stored username is empty, loads the owner user row", async () => {
    mockUserFindUnique.mockResolvedValue({
      username: "playlist-owner",
    } as Awaited<ReturnType<DbModule["prisma"]["user"]["findUnique"]>>);

    await expect(resolvePublicShareUsername(OWNER_ID, null)).resolves.toBe(
      "playlist-owner",
    );
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { discogs_user_id: OWNER_ID },
      select: { username: true },
    });
  });

  it("returns null when neither stored nor owner username is available", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    await expect(resolvePublicShareUsername(OWNER_ID, "")).resolves.toBeNull();
  });
});
