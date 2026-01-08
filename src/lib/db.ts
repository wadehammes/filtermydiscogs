import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool, type PoolConfig } from "pg";

// PrismaClient and Pool are attached to the `global` object to prevent
// exhausting your database connection limit in serverless environments.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

/**
 * Validates and sanitizes the DATABASE_URL connection string
 * Ensures SSL is enforced in production
 */
function validateAndSanitizeConnectionString(connectionString: string): string {
  const url = new URL(connectionString);

  // Enforce SSL in production
  if (process.env.NODE_ENV === "production") {
    const sslMode = url.searchParams.get("sslmode");
    if (!sslMode || sslMode !== "require") {
      url.searchParams.set("sslmode", "require");
    }
  }

  // Add performance-related connection parameters
  url.searchParams.set("statement_timeout", "30000"); // 30 seconds
  url.searchParams.set("connect_timeout", "10"); // 10 seconds
  url.searchParams.set("pool_timeout", "10"); // 10 seconds

  return url.toString();
}

/**
 * Gets a sanitized version of the connection string for logging
 * (removes credentials)
 */
function sanitizeConnectionStringForLogging(connectionString: string): string {
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
}

/**
 * Environment-aware pool configuration
 */
function getPoolConfig(connectionString: string): PoolConfig {
  const isProduction = process.env.NODE_ENV === "production";

  // Dynamic pool sizing based on environment
  // Development: smaller pool, Production: optimized for serverless
  const maxConnections = isProduction
    ? parseInt(process.env.DB_POOL_MAX || "10", 10)
    : parseInt(process.env.DB_POOL_MAX || "5", 10);

  const minConnections = isProduction
    ? parseInt(process.env.DB_POOL_MIN || "2", 10)
    : 1;

  return {
    connectionString,
    max: maxConnections,
    min: minConnections,
    // Close idle connections quickly in serverless environments
    idleTimeoutMillis: parseInt(
      process.env.DB_POOL_IDLE_TIMEOUT || "30000",
      10,
    ), // 30 seconds
    // Fail fast if connection can't be established
    connectionTimeoutMillis: parseInt(
      process.env.DB_POOL_CONNECTION_TIMEOUT || "10000",
      10,
    ), // 10 seconds
    // Allow pool to close when idle (good for serverless)
    allowExitOnIdle: true,
    // Statement cache for prepared statements (improves performance)
    statement_timeout: parseInt(
      process.env.DB_STATEMENT_TIMEOUT || "30000",
      10,
    ), // 30 seconds
  };
}

let prismaInstance: PrismaClient;

try {
  const rawConnectionString = process.env.DATABASE_URL;
  if (!rawConnectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Validate and enhance connection string
  const connectionString =
    validateAndSanitizeConnectionString(rawConnectionString);

  // Log sanitized connection string for debugging (development only)
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[DB] Connecting with config: ${sanitizeConnectionStringForLogging(connectionString)}`,
    );
  }

  // Reuse pool instance in serverless environments
  // Configure pool to prevent connection exhaustion
  // Vercel Postgres limits: Hobby (20), Pro (50), Enterprise (varies)
  const poolConfig = getPoolConfig(connectionString);
  const pool = globalForPrisma.pool ?? new Pool(poolConfig);

  if (!globalForPrisma.pool) {
    globalForPrisma.pool = pool;

    // Add connection pool event listeners for monitoring
    pool.on("connect", () => {
      if (process.env.NODE_ENV === "development") {
        console.log("[DB] New connection established");
      }
    });

    pool.on("error", (err) => {
      console.error("[DB] Pool error:", err);
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

  // Prisma Client configuration with optimizations
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["error", "warn", "query"]
          : process.env.DB_LOG_QUERIES === "true"
            ? ["error", "warn", "query"]
            : ["error"],
    });

  // Connection health check with exponential backoff
  let healthCheckAttempts = 0;
  const maxHealthCheckAttempts = 3;

  async function performHealthCheck(): Promise<void> {
    try {
      await prismaInstance.$queryRaw`SELECT 1`;
      healthCheckAttempts = 0;
    } catch (error) {
      healthCheckAttempts++;
      if (healthCheckAttempts < maxHealthCheckAttempts) {
        const backoffDelay = 2 ** healthCheckAttempts * 1000; // Exponential backoff
        console.warn(
          `[DB] Health check failed (attempt ${healthCheckAttempts}/${maxHealthCheckAttempts}). Retrying in ${backoffDelay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        return performHealthCheck();
      }
      console.error("[DB] Health check failed after max attempts");
      throw error;
    }
  }

  // Perform initial health check
  performHealthCheck().catch((error) => {
    console.error("[DB] Initial health check failed:", error);
  });
} catch (error) {
  console.error("Failed to initialize Prisma Client:", error);
  // Don't expose connection string in error
  const sanitizedError =
    error instanceof Error
      ? error.message.replace(/DATABASE_URL[^;]*/gi, "DATABASE_URL=***")
      : "Unknown error";
  throw new Error(
    `Prisma Client not initialized: ${sanitizedError}. Please run 'pnpm db:generate' and ensure DATABASE_URL is set.`,
  );
}

export const prisma = prismaInstance;

// Always cache Prisma Client in serverless environments (including production)
// This prevents creating multiple connections per function invocation
// Vercel serverless functions can reuse the same instance across invocations
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

/**
 * Get connection pool metrics for monitoring
 */
export function getPoolMetrics() {
  const pool = globalForPrisma.pool;
  if (!pool) {
    return null;
  }

  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

// Re-export Prisma types
export type { Crate, CrateRelease, Prisma } from "@prisma/client";
