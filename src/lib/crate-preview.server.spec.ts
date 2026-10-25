import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("src/lib/db", () => ({
  prisma: {
    crateRelease: { findMany: jest.fn() },
  },
}));

type DbModule = typeof import("src/lib/db");

let fetchPublicCrateCoverThumbUrls: typeof import("src/lib/crate-preview.server")["fetchPublicCrateCoverThumbUrls"];
let mockFindMany: jest.MockedFunction<
  DbModule["prisma"]["crateRelease"]["findMany"]
>;

describe("fetchPublicCrateCoverThumbUrls", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    const [serverModule, db] = await Promise.all([
      import("src/lib/crate-preview.server"),
      import("src/lib/db"),
    ]);
    fetchPublicCrateCoverThumbUrls =
      serverModule.fetchPublicCrateCoverThumbUrls;
    mockFindMany = jest.mocked(db.prisma.crateRelease.findMany);
  });

  it("loads crate releases in sort order and returns up to four thumb urls", async () => {
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
