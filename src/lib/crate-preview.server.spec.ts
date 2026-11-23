import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  type CrateReleasePreviewQueryRow,
  type CrateReleaseReleaseDataOnlyRow,
  crateReleaseFactory,
} from "src/tests/factories/CrateRelease.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockPrismaDelegate } from "src/tests/helpers/mockPrismaDelegate";

jest.mock("src/lib/db", () => ({
  prisma: {
    crateRelease: { findMany: jest.fn() },
    $queryRaw: jest.fn(),
  },
}));

let fetchPublicCrateCoverThumbUrls: typeof import("src/lib/crate-preview.server")["fetchPublicCrateCoverThumbUrls"];
let fetchCratePreviewThumbs: typeof import("src/lib/crate-preview.server")["fetchCratePreviewThumbs"];
let mockFindMany: jest.Mock<
  (...args: unknown[]) => Promise<CrateReleaseReleaseDataOnlyRow[]>
>;
let mockQueryRaw: jest.Mock<
  (...args: unknown[]) => Promise<CrateReleasePreviewQueryRow[]>
>;

describe("crate-preview.server", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    const [serverModule, db] = await Promise.all([
      import("src/lib/crate-preview.server"),
      import("src/lib/db"),
    ]);
    fetchPublicCrateCoverThumbUrls =
      serverModule.fetchPublicCrateCoverThumbUrls;
    fetchCratePreviewThumbs = serverModule.fetchCratePreviewThumbs;
    mockFindMany = mockPrismaDelegate<CrateReleaseReleaseDataOnlyRow[]>(
      jest.mocked(db.prisma.crateRelease.findMany),
    );
    mockQueryRaw = mockPrismaDelegate<CrateReleasePreviewQueryRow[]>(
      jest.mocked(db.prisma.$queryRaw),
    );
  });

  it("fetchCratePreviewThumbs returns up to three preview thumbs per crate from ranked release rows", async () => {
    const releaseA = releaseFactory.withDisplayDefaults({
      basic_information: {
        ...releaseFactory.build().basic_information,
        thumb: "https://example.com/a1.jpg",
        cover_image: "",
      },
    });
    const releaseB = releaseFactory.withDisplayDefaults({
      basic_information: {
        ...releaseFactory.build().basic_information,
        thumb: "https://example.com/b1.jpg",
        cover_image: "",
      },
    });

    mockQueryRaw.mockResolvedValue([
      crateReleaseFactory.previewQueryRow("crate-a", releaseA),
      crateReleaseFactory.previewQueryRow("crate-b", releaseB),
    ]);

    const thumbs = await fetchCratePreviewThumbs({
      userId: 7,
      crateIds: ["crate-a", "crate-b"],
    });

    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
    expect(thumbs.get("crate-a")).toEqual(["https://example.com/a1.jpg"]);
    expect(thumbs.get("crate-b")).toEqual(["https://example.com/b1.jpg"]);
  });

  it("fetchPublicCrateCoverThumbUrls loads crate releases in sort order and returns up to four thumb urls", async () => {
    const releaseOne = releaseFactory.withDisplayDefaults({
      basic_information: {
        ...releaseFactory.build().basic_information,
        thumb: "https://example.com/1.jpg",
        cover_image: "",
      },
    });
    const releaseTwo = releaseFactory.withDisplayDefaults({
      basic_information: {
        ...releaseFactory.build().basic_information,
        thumb: "https://example.com/2.jpg",
        cover_image: "",
      },
    });

    mockFindMany.mockResolvedValue([
      crateReleaseFactory.releaseDataOnlyFindManyRow(releaseOne),
      crateReleaseFactory.releaseDataOnlyFindManyRow(releaseTwo),
    ]);

    await expect(
      fetchPublicCrateCoverThumbUrls({
        userId: 9,
        crateId: "11111111-2222-3333-4444-555555555555",
      }),
    ).resolves.toEqual([
      "https://example.com/1.jpg",
      "https://example.com/2.jpg",
    ]);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          user_id: 9,
          crate_id: "11111111-2222-3333-4444-555555555555",
        },
      }),
    );
  });
});
