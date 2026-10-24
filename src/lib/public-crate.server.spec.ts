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
}));

jest.mock("src/lib/db", () => ({
  prisma: {
    crate: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("src/lib/sentry/reportInfrastructureFailure", () => ({
  reportInfrastructureFailure: jest.fn(),
}));

type DbModule = typeof import("src/lib/db");

let getPublicCrateIdsForStaticGeneration: typeof import("src/lib/public-crate.server")["getPublicCrateIdsForStaticGeneration"];
let mockFindMany: jest.MockedFunction<DbModule["prisma"]["crate"]["findMany"]>;

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
