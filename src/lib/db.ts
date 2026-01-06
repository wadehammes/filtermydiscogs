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
  const pool = globalForPrisma.pool ?? new Pool({ connectionString });
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
