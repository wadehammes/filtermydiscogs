import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

// PrismaClient and Pool are attached to the `global` object to prevent
// exhausting your database connection limit in serverless environments.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

let prismaInstance: PrismaClient;

try {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Reuse pool instance in serverless environments
  // Configure pool to prevent connection exhaustion
  // Vercel Postgres limits: Hobby (20), Pro (50), Enterprise (varies)
  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString,
      // Limit max connections to prevent exhausting database connection limit
      // Leave headroom for migrations, direct DB access, etc.
      max: 10, // Safe default for serverless (adjust based on your Vercel plan)
      // Close idle connections quickly in serverless environments
      idleTimeoutMillis: 30000, // 30 seconds
      // Fail fast if connection can't be established
      connectionTimeoutMillis: 10000, // 10 seconds
      // Allow pool to close when idle (good for serverless)
      allowExitOnIdle: true,
    });
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = pool;
  }

  const adapter = new PrismaPg(pool);

  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
} catch (error) {
  console.error("Failed to initialize Prisma Client:", error);
  throw new Error(
    "Prisma Client not initialized. Please run 'pnpm db:generate' and ensure DATABASE_URL is set.",
  );
}

export const prisma = prismaInstance;

// Always cache Prisma Client in serverless environments (including production)
// This prevents creating multiple connections per function invocation
// Vercel serverless functions can reuse the same instance across invocations
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

// Re-export Prisma types
export type { Crate, CrateRelease, Prisma } from "@prisma/client";
