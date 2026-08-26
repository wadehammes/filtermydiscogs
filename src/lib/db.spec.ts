import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

const createPostgresClient = jest.fn(() => ({
  orm: {
    public: {
      CrateSetMarkers: {},
      Crates: {},
    },
  },
  runtime: () => ({
    query: jest.fn(async () => []),
  }),
  transaction: jest.fn(),
  raw: {},
}));

jest.mock("@prisma/orm-postgres/runtime", () => ({
  __esModule: true,
  default: createPostgresClient,
}));

jest.mock("pg", () => ({
  Pool: jest.fn().mockImplementation(() => ({
    totalCount: 0,
    idleCount: 0,
    waitingCount: 0,
  })),
}));

describe("src/lib/db lazy init", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    createPostgresClient.mockClear();
    Reflect.deleteProperty(globalThis, "pool");
    Reflect.deleteProperty(globalThis as { db?: unknown }, "db");
  });

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      Reflect.deleteProperty(process.env, "DATABASE_URL");
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  it("can be imported without DATABASE_URL", async () => {
    Reflect.deleteProperty(process.env, "DATABASE_URL");

    await expect(import("src/lib/db")).resolves.toMatchObject({
      ormTimestamp: expect.any(Function),
      ormDate: expect.any(Function),
    });
    expect(createPostgresClient).not.toHaveBeenCalled();
  });

  it("creates the client on first db access when DATABASE_URL is set", async () => {
    process.env.DATABASE_URL =
      "postgresql://user:pass@localhost:5432/testdb?sslmode=require";

    const { db } = await import("src/lib/db");

    expect(createPostgresClient).not.toHaveBeenCalled();
    expect(db.orm.public).toBeDefined();
    expect(createPostgresClient).toHaveBeenCalledTimes(1);
  });

  it("throws on first db access when DATABASE_URL is missing", async () => {
    Reflect.deleteProperty(process.env, "DATABASE_URL");

    const { db } = await import("src/lib/db");

    expect(() => db.orm).toThrow(
      "DATABASE_URL environment variable is not set",
    );
  });
});
