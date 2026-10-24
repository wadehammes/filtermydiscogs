import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool, type PoolConfig } from "pg";
import {
  isPrismaPostgresPooledConnectionString,
  readRuntimeDatabaseUrlFromEnv,
  sanitizePostgresConnectionStringForPg,
} from "src/lib/databaseUrlEnv";
import { reportInfrastructureFailure } from "src/lib/sentry/reportInfrastructureFailure";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const sanitizeConnectionStringForLogging = (
  connectionString: string,
): string => {
  try {
    const url = new URL(connectionString);
    if (url.password) {
      url.password = "***";
    }
    if (url.username) {
      url.username = "***";
    }
    return url.toString();
  } catch {
    return "***";
  }
};

const getPoolConfig = (connectionString: string): PoolConfig => {
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

  const poolConfig: PoolConfig = {
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
  };

  if (!isPrismaPostgresPooledConnectionString(connectionString)) {
    poolConfig.statement_timeout = parseInt(
      process.env.DB_STATEMENT_TIMEOUT || "30000",
      10,
    );
  }

  return poolConfig;
};

const PRISMA_MODEL_DELEGATES = [
  "user",
  "userTrack",
  "crate",
  "crateRelease",
  "crateSetMarker",
  "productAnalyticsEvent",
  "productAnalyticsDailyRollup",
] as const;

const isCachedPrismaClientCurrent = (client: PrismaClient): boolean =>
  PRISMA_MODEL_DELEGATES.every((delegate) => delegate in client);

const createPrismaInitializationError = (error: unknown): Error => {
  const sanitizedError =
    error instanceof Error
      ? error.message.replace(/DATABASE_URL[^;]*/gi, "DATABASE_URL=***")
      : "Unknown error";

  return new Error(
    `Prisma Client not initialized: ${sanitizedError}. Please run 'pnpm db:generate' and ensure DATABASE_URL is set.`,
  );
};

const initializePrismaClient = (): PrismaClient => {
  const rawConnectionString = readRuntimeDatabaseUrlFromEnv();
  if (!rawConnectionString) {
    throw new Error(
      "DATABASE_URL or DATABASE_URL_POOLED environment variable is not set",
    );
  }

  const connectionString =
    sanitizePostgresConnectionStringForPg(rawConnectionString);

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[DB] Connecting with config: ${sanitizeConnectionStringForLogging(connectionString)}`,
    );
  }

  const poolConfig = getPoolConfig(connectionString);
  const pool = globalForPrisma.pool ?? new Pool(poolConfig);

  if (!globalForPrisma.pool) {
    globalForPrisma.pool = pool;

    pool.on("connect", () => {
      if (process.env.NODE_ENV === "development") {
        console.log("[DB] New connection established");
      }
    });

    pool.on("error", (err) => {
      console.error("[DB] Pool error:", err);
      reportInfrastructureFailure(
        "database",
        err,
        { source: "pool" },
        { throttleKey: "db-pool-error", throttleMs: 60_000 },
      );
    });

    pool.on("acquire", () => {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[DB] Connection acquired. Pool size: ${pool.totalCount}, idle: ${pool.idleCount}, waiting: ${pool.waitingCount}`,
        );
      }
    });
  }

  const adapter = new PrismaPg(pool);

  const prismaClientLog =
    process.env.NODE_ENV === "development"
      ? (["error", "warn", "query"] as const)
      : process.env.DB_LOG_QUERIES === "true"
        ? (["error", "warn", "query"] as const)
        : (["error"] as const);

  if (
    globalForPrisma.prisma &&
    !isCachedPrismaClientCurrent(globalForPrisma.prisma)
  ) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[DB] Cached Prisma client is missing new models; recreating client.",
      );
    }

    void globalForPrisma.prisma.$disconnect().catch(() => {});
    globalForPrisma.prisma = undefined;
  }

  const prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      adapter,
      log: [...prismaClientLog],
    });

  let healthCheckAttempts = 0;
  const maxHealthCheckAttempts = 3;

  const performHealthCheck = async (): Promise<void> => {
    try {
      await prismaInstance.$queryRaw`SELECT 1`;
      healthCheckAttempts = 0;
    } catch (error) {
      healthCheckAttempts += 1;
      if (healthCheckAttempts < maxHealthCheckAttempts) {
        const backoffDelay = 2 ** healthCheckAttempts * 1000;
        console.warn(
          `[DB] Health check failed (attempt ${healthCheckAttempts}/${maxHealthCheckAttempts}). Retrying in ${backoffDelay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        await performHealthCheck();
        return;
      }
      console.error("[DB] Health check failed after max attempts");
      throw error;
    }
  };

  performHealthCheck().catch((error) => {
    console.error("[DB] Initial health check failed:", error);
    reportInfrastructureFailure("database", error, {
      source: "initial_health_check",
    });
  });

  globalForPrisma.prisma = prismaInstance;
  return prismaInstance;
};

const getPrismaClient = (): PrismaClient => {
  if (
    globalForPrisma.prisma &&
    isCachedPrismaClientCurrent(globalForPrisma.prisma)
  ) {
    return globalForPrisma.prisma;
  }

  try {
    return initializePrismaClient();
  } catch (error) {
    console.error("Failed to initialize Prisma Client:", error);
    reportInfrastructureFailure("database", error, {
      source: "prisma_init",
    });
    throw createPrismaInitializationError(error);
  }
};

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);

    if (typeof value === "function") {
      return value.bind(client);
    }

    return value;
  },
  has(_target, prop) {
    const client = getPrismaClient();
    return prop in client;
  },
});

export const getPoolMetrics = () => {
  const pool = globalForPrisma.pool;
  if (!pool) {
    return null;
  }

  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
};
