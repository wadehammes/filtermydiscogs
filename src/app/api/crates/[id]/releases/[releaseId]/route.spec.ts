import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest } from "next/server";
import { verifiedDiscogsUserFactory } from "src/tests/factories/VerifiedDiscogsUser.factory";

jest.mock("src/lib/db", () => ({
  prisma: {
    crate: {
      findUnique: jest.fn(),
    },
    crateRelease: {
      delete: jest.fn(),
    },
  },
}));

jest.mock("src/lib/api-helpers");

jest.mock("src/lib/public-share-cache.server", () => ({
  revalidatePublicCrateShareWhenPublic: jest.fn(),
}));

type RouteModule =
  typeof import("src/app/api/crates/[id]/releases/[releaseId]/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");
type DbModule = typeof import("src/lib/db");
type PublicShareCacheModule =
  typeof import("src/lib/public-share-cache.server");

let DELETE: RouteModule["DELETE"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockFindUnique: jest.MockedFunction<
  DbModule["prisma"]["crate"]["findUnique"]
>;
let mockDelete: jest.MockedFunction<
  DbModule["prisma"]["crateRelease"]["delete"]
>;
let mockRevalidatePublicCrateShareWhenPublic: jest.MockedFunction<
  PublicShareCacheModule["revalidatePublicCrateShareWhenPublic"]
>;

const crateId = "ab65c378-fab9-42c0-96bb-c308d413cbbb";
const releaseId = "release-instance-1";
const verifiedUser = verifiedDiscogsUserFactory.asVerifiedResult({
  userId: 42,
});

beforeAll(async () => {
  const [routeModule, apiHelpers, db, publicShareCache] = await Promise.all([
    import("src/app/api/crates/[id]/releases/[releaseId]/route"),
    import("src/lib/api-helpers"),
    import("src/lib/db"),
    import("src/lib/public-share-cache.server"),
  ]);

  DELETE = routeModule.DELETE;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockFindUnique = jest.mocked(db.prisma.crate.findUnique);
  mockDelete = jest.mocked(db.prisma.crateRelease.delete);
  mockRevalidatePublicCrateShareWhenPublic = jest.mocked(
    publicShareCache.revalidatePublicCrateShareWhenPublic,
  );
});

describe("/api/crates/[id]/releases/[releaseId] DELETE", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
    mockFindUnique.mockResolvedValue({ id: crateId } as never);
    mockDelete.mockResolvedValue({} as never);
    mockRevalidatePublicCrateShareWhenPublic.mockResolvedValue(undefined);
  });

  it("revalidates the public share when a release is removed", async () => {
    const request = new NextRequest(
      `http://localhost/api/crates/${crateId}/releases/${releaseId}`,
      { method: "DELETE" },
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: crateId, releaseId }),
    });

    expect(response.status).toBe(200);
    expect(mockRevalidatePublicCrateShareWhenPublic).toHaveBeenCalledWith(
      crateId,
    );
  });
});
