import postgres from "@prisma/orm-postgres/runtime";
import type {
  JsonValue,
  TimestampString,
} from "@prisma/orm-postgres/target/codec-types";
import { Pool, type PoolConfig } from "pg";
import type { CodecTypes, Contract } from "src/prisma/contract.d";
import contractJson from "src/prisma/contract.json";

export type { JsonValue };

export type OrmTimestamp = TimestampString<3>;
export type OrmDate = CodecTypes["pg/date-string@1"]["input"];

export const ormTimestamp = (value: Date): OrmTimestamp =>
  value.toISOString() as OrmTimestamp;

export const ormDate = (value: Date): OrmDate =>
  value.toISOString().slice(0, 10) as OrmDate;

export type DbClient = ReturnType<typeof postgres<Contract>>;
export type DbTransaction = Parameters<
  Parameters<DbClient["transaction"]>[0]
>[0];

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
  db: DbClient | undefined;
};

function validateAndSanitizeConnectionString(connectionString: string): string {
  const url = new URL(connectionString);

  const sslMode = url.searchParams.get("sslmode");
  if (
    sslMode === "prefer" ||
    sslMode === "require" ||
    sslMode === "verify-ca"
  ) {
    url.searchParams.set("sslmode", "verify-full");
  } else if (process.env.NODE_ENV === "production" && !sslMode) {
    url.searchParams.set("sslmode", "verify-full");
  }

  url.searchParams.set("statement_timeout", "30000");
  url.searchParams.set("connect_timeout", "10");
  url.searchParams.set("pool_timeout", "10");

  return url.toString();
}

function getPoolConfig(connectionString: string): PoolConfig {
  const isProduction = process.env.NODE_ENV === "production";
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

  let maxConnections = isProduction
    ? parseInt(process.env.DB_POOL_MAX || "10", 10)
    : parseInt(process.env.DB_POOL_MAX || "5", 10);

  let minConnections = isProduction
    ? parseInt(process.env.DB_POOL_MIN || "2", 10)
    : 1;

  if (isBuildPhase) {
    maxConnections = 1;
    minConnections = 0;
  }

  return {
    connectionString,
    max: maxConnections,
    min: minConnections,
    idleTimeoutMillis: parseInt(
      process.env.DB_POOL_IDLE_TIMEOUT || "30000",
      10,
    ),
    connectionTimeoutMillis: parseInt(
      process.env.DB_POOL_CONNECTION_TIMEOUT || "10000",
      10,
    ),
    allowExitOnIdle: true,
    statement_timeout: parseInt(
      process.env.DB_STATEMENT_TIMEOUT || "30000",
      10,
    ),
  };
}

function createDb(): DbClient {
  const rawConnectionString = process.env.DATABASE_URL;
  if (!rawConnectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const connectionString =
    validateAndSanitizeConnectionString(rawConnectionString);
  const pool = globalForDb.pool ?? new Pool(getPoolConfig(connectionString));

  if (!globalForDb.pool) {
    globalForDb.pool = pool;
  }

  return postgres<Contract>({
    contractJson,
    pg: pool as never,
  });
}

export const db = globalForDb.db ?? createDb();

if (!globalForDb.db) {
  globalForDb.db = db;
}

export const orm = db.orm.public;

export function getPoolMetrics() {
  const pool = globalForDb.pool;
  if (!pool) {
    return null;
  }

  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

export async function countRows(query: unknown): Promise<number> {
  const { n } = await (
    query as {
      aggregate: (
        fn: (aggregate: { count: () => unknown }) => { n: unknown },
      ) => Promise<{ n: number }>;
    }
  ).aggregate((aggregate) => ({
    n: aggregate.count(),
  }));

  return n;
}

export async function queryRawRows<TRow>(
  plan: Parameters<ReturnType<DbClient["runtime"]>["query"]>[0],
): Promise<TRow[]> {
  const rows = await db.runtime().query(plan);
  return rows as TRow[];
}

export const sqlTimestamp = (value: Date): string => value.toISOString();
export const sqlDate = (value: Date): string =>
  value.toISOString().slice(0, 10);

export const toOrmDate = (value: unknown): Date =>
  new Date(value as string | Date);

export const toOrmJson = (value: unknown): JsonValue => value as JsonValue;
