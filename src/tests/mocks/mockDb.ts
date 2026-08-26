import { jest } from "@jest/globals";

type TerminalMocks = {
  all: ReturnType<typeof jest.fn>;
  first: ReturnType<typeof jest.fn>;
  create: ReturnType<typeof jest.fn>;
  createAll: ReturnType<typeof jest.fn>;
  upsert: ReturnType<typeof jest.fn>;
  update: ReturnType<typeof jest.fn>;
  updateAll: ReturnType<typeof jest.fn>;
  updateAndCount: ReturnType<typeof jest.fn>;
  delete: ReturnType<typeof jest.fn>;
  deleteAll: ReturnType<typeof jest.fn>;
  deleteAndCount: ReturnType<typeof jest.fn>;
  aggregate: ReturnType<typeof jest.fn>;
  groupBy: ReturnType<typeof jest.fn>;
};

export type OrmCollectionMock = TerminalMocks & {
  where: ReturnType<typeof jest.fn>;
  orderBy: ReturnType<typeof jest.fn>;
  offset: ReturnType<typeof jest.fn>;
  limit: ReturnType<typeof jest.fn>;
  include: ReturnType<typeof jest.fn>;
  select: ReturnType<typeof jest.fn>;
};

export const createOrmCollectionMock = (): OrmCollectionMock => {
  const mock: Partial<OrmCollectionMock> = {};

  const chain = () => mock as OrmCollectionMock;

  mock.where = jest.fn(chain);
  mock.orderBy = jest.fn(chain);
  mock.offset = jest.fn(chain);
  mock.limit = jest.fn(chain);
  mock.include = jest.fn(chain);
  mock.select = jest.fn(chain);
  mock.all = jest.fn(async () => []);
  mock.first = jest.fn(async () => null);
  mock.create = jest.fn(async () => ({}));
  mock.createAll = jest.fn(async () => undefined);
  mock.upsert = jest.fn(async () => ({}));
  mock.update = jest.fn(async () => null);
  mock.updateAll = jest.fn(async () => []);
  mock.updateAndCount = jest.fn(async () => 0);
  mock.delete = jest.fn(async () => null);
  mock.deleteAll = jest.fn(async () => []);
  mock.deleteAndCount = jest.fn(async () => 0);
  mock.aggregate = jest.fn(async () => ({}));
  mock.groupBy = jest.fn(chain);

  return mock as OrmCollectionMock;
};

export const createDbModuleMock = () => {
  const ormTimestamp = (value: Date) => value.toISOString();
  const ormDate = (value: Date) => value.toISOString().slice(0, 10);
  const sqlDate = (value: Date) => value.toISOString().slice(0, 10);
  const sqlTimestamp = (value: Date) => value.toISOString();
  const toOrmDate = (value: unknown) => new Date(value as string | Date);
  const toOrmJson = (value: unknown) => value;

  const Users = createOrmCollectionMock();
  const Crates = createOrmCollectionMock();
  const CrateReleases = createOrmCollectionMock();
  const CrateSetMarkers = createOrmCollectionMock();
  const ProductAnalyticsEvents = createOrmCollectionMock();
  const ProductAnalyticsDailyRollups = createOrmCollectionMock();

  const publicOrm = {
    Users,
    Crates,
    CrateReleases,
    CrateSetMarkers,
    ProductAnalyticsEvents,
    ProductAnalyticsDailyRollups,
  };

  const countRows = jest.fn(async () => 0);
  const queryRawRows = jest.fn(async () => []);
  const executeRaw = jest.fn(async () => 0);

  const db = {
    transaction: jest.fn(
      async (
        callback: (tx: { orm: { public: typeof publicOrm } }) => unknown,
      ) => callback({ orm: { public: publicOrm } }),
    ),
    raw: {
      sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
        returnsRow: () => ({
          build: () => ({ strings, values }),
        }),
        affectedCount: () => ({
          build: () => ({ strings, values }),
        }),
      }),
    },
    runtime: () => ({
      query: queryRawRows,
      execute: executeRaw,
    }),
  };

  return {
    db,
    orm: publicOrm,
    countRows,
    queryRawRows,
    executeRaw,
    getPoolMetrics: jest.fn(() => null),
    ormTimestamp,
    ormDate,
    sqlDate,
    sqlTimestamp,
    toOrmDate,
    toOrmJson,
  };
};
