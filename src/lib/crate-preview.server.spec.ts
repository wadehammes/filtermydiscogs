import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("src/lib/db", () => ({
  prisma: {
    crateRelease: { findMany: jest.fn() },
    $queryRaw: jest.fn(),
  },
}));

type DbModule = typeof import("src/lib/db");

let fetchPublicCrateCoverThumbUrls: typeof import("src/lib/crate-preview.server")["fetchPublicCrateCoverThumbUrls"];
let fetchCratePreviewThumbs: typeof import("src/lib/crate-preview.server")["fetchCratePreviewThumbs"];
let mockFindMany: jest.MockedFunction<
  DbModule["prisma"]["crateRelease"]["findMany"]
>;
let mockQueryRaw: jest.MockedFunction<DbModule["prisma"]["$queryRaw"]>;

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
    mockFindMany = jest.mocked(db.prisma.crateRelease.findMany);
    mockQueryRaw = jest.mocked(db.prisma.$queryRaw);
  });

  it("fetchCratePreviewThumbs returns up to three preview thumbs per crate from ranked release rows", async () => {
    mockQueryRaw.mockResolvedValue([
      {
        crate_id: "crate-a",
        release_data: {
          basic_information: {
            thumb: "https://example.com/a1.jpg",
            cover_image: "",
          },
        },
      },
      {
        crate_id: "crate-b",
        release_data: {
          basic_information: {
            thumb: "https://example.com/b1.jpg",
            cover_image: "",
          },
        },
      },
    ] as never);

    const thumbs = await fetchCratePreviewThumbs({
      userId: 7,
      crateIds: ["crate-a", "crate-b"],
    });

    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
    expect(thumbs.get("crate-a")).toEqual(["https://example.com/a1.jpg"]);
    expect(thumbs.get("crate-b")).toEqual(["https://example.com/b1.jpg"]);
  });

  it("fetchPublicCrateCoverThumbUrls loads crate releases in sort order and returns up to four thumb urls", async () => {
    mockFindMany.mockResolvedValue([
      {
        release_data: {
          basic_information: {
            thumb: "https://example.com/1.jpg",
            cover_image: "",
          },
        },
      },
      {
        release_data: {
          basic_information: {
            thumb: "https://example.com/2.jpg",
            cover_image: "",
          },
        },
      },
    ] as never);

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