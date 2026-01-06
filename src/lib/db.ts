import { PrismaClient } from "@prisma/client";

// PrismaClient is attached to the `global` object to prevent
// exhausting your database connection limit in serverless environments.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient;

try {
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
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
