import { PrismaClient } from "@prisma/client";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
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

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Re-export Prisma types
export type { Crate, CrateRelease, Prisma } from "@prisma/client";
