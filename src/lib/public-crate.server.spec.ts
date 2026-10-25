import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { LOGIN_DEMO_PUBLIC_CRATE_ID } from "src/constants/publicCrate.constants";

jest.mock("next/cache", () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
}));

jest.mock("src/lib/db", () => ({
  prisma: {
    crate: {
      findMany: jest.fn(),
    },
    crateRelease: {
      count: jest.fn(),
    },
  },
}));

jest.mock("src/lib/sentry/reportInfrastructureFailure", () => ({
  reportInfrastructureFailure: jest.fn(),
}));

jest.mock("src/lib/public-crate-query.server", () => ({
  findPublicCrateById: jest.fn(),
}));

jest.mock("src/lib/crate-preview.server", () => ({
  fetchPublicCrateCoverThumbUrls: jest.fn(),
}));

jest.mock("src/lib/public-share-username.server", () => ({
  resolvePublicShareUsername: jest.fn(),
}));

type DbModule = typeof import("src/lib/db");

let getPublicCrateIdsForStaticGeneration: typeof import("src/lib/public-crate.server")["getPublicCrateIdsForStaticGeneration"];
let getPublicCrateForOg: typeof import("src/lib/public-crate.server")["getPublicCrateForOg"];
let mockFindMany: jest.MockedFunction<DbModule["prisma"]["crate"]["findMany"]>;
let mockCrateReleaseCount: jest.MockedFunction<
  DbModule["prisma"]["crateRelease"]["count"]
>;
let mockFindPublicCrateById: jest.MockedFunction<
  typeof import("src/lib/public-crate-query.server")["findPublicCrateById"]
>;
let mockFetchPublicCrateCoverThumbUrls: jest.MockedFunction<
  typeof import("src/lib/crate-preview.server")["fetchPublicCrateCoverThumbUrls"]
>;
let mockResolvePublicShareUsername: jest.MockedFunction<
  typeof import("src/lib/public-share-username.server")["resolvePublicShareUsername"]
>;

describe("getPublicCrateIdsForStaticGeneration", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.POSTGRES_URL =
      "postgres://user:pass@db.prisma.io:5432/postgres?sslmode=require";

    const [serverModule, db] = await Promise.all([
      import("src/lib/public-crate.server"),
      import("src/lib/db"),
    ]);
    getPublicCrateIdsForStaticGeneration =
      serverModule.getPublicCrateIdsForStaticGeneration;
    mockFindMany = jest.mocked(db.prisma.crate.findMany);
  });

  afterEach(() => {
    delete process.env.POSTGRES_URL;
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_URL_POOLED;
    delete process.env.NEXT_PHASE;
  });

  it("when no runtime database URL is configured, returns an empty list", async () => {
    delete process.env.POSTGRES_URL;
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_URL_POOLED;
    delete process.env.DIRECT_URL;

    await expect(getPublicCrateIdsForStaticGeneration(25)).resolves.toEqual([]);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("when build query returns no public crates, returns demo crate id", async () => {
    process.env.NEXT_PHASE = "phase-production-build";
    mockFindMany.mockResolvedValue([]);

    await expect(getPublicCrateIdsForStaticGeneration(25)).resolves.toEqual([
      LOGIN_DEMO_PUBLIC_CRATE_ID,
    ]);
  });

  it("when build query fails, returns demo crate id for generateStaticParams", async () => {
    process.env.NEXT_PHASE = "phase-production-build";
    mockFindMany.mockRejectedValue(new Error("too many connections"));

    await expect(getPublicCrateIdsForStaticGeneration(25)).resolves.toEqual([
      LOGIN_DEMO_PUBLIC_CRATE_ID,
    ]);
  });
});

describe("getPublicCrateForOg", () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    const [serverModule, queryModule, previewModule, usernameModule, db] =
      await Promise.all([
        import("src/lib/public-crate.server"),
        import("src/lib/public-crate-query.server"),
        import("src/lib/crate-preview.server"),
        import("src/lib/public-share-username.server"),
        import("src/lib/db"),
      ]);

    getPublicCrateForOg = serverModule.getPublicCrateForOg;
    mockCrateReleaseCount = jest.mocked(db.prisma.crateRelease.count);
    mockCrateReleaseCount.mockResolvedValue(8);
    mockFindPublicCrateById = jest.mocked(queryModule.findPublicCrateById);
    mockFetchPublicCrateCoverThumbUrls = jest.mocked(
      previewModule.fetchPublicCrateCoverThumbUrls,
    );
    mockResolvePublicShareUsername = jest.mocked(
      usernameModule.resolvePublicShareUsername,
    );
  });

  it("returns crate name, resolved username, and cover thumb urls", async () => {
    const crateId = "11111111-2222-3333-4444-555555555555";
    mockFindPublicCrateById.mockResolvedValue({
      user_id: 42,
      id: crateId,
      name: "Gig crate",
      username: null,
      is_default: false,
      private: false,
      created_at: new Date("2026-01-01"),
      updated_at: new Date("2026-01-02"),
    });
    mockResolvePublicShareUsername.mockResolvedValue("dj-crate");
    mockFetchPublicCrateCoverThumbUrls.mockResolvedValue([
      "https://example.com/1.jpg",
      "https://example.com/2.jpg",
    ]);

    await expect(getPublicCrateForOg(crateId)).resolves.toEqual({
      name: "Gig crate",
      username: "dj-crate",
      coverThumbUrls: [
        "https://example.com/1.jpg",
        "https://example.com/2.jpg",
      ],
      releaseCount: 8,
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
  });

  it("when the crate is missing, returns null", async () => {
    mockFindPublicCrateById.mockResolvedValue(null);

    await expect(
      getPublicCrateForOg("11111111-2222-3333-4444-555555555555"),
    ).resolves.toBeNull();
  });
});
