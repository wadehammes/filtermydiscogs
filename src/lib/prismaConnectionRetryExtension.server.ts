import "server-only";

import type { PrismaClient } from "@prisma/client";
import { isTransientDatabaseConnectionFailure } from "src/lib/databaseConnectionErrorMessage";

export const PRISMA_CONNECTION_RETRY_MAX_ATTEMPTS = 2;

export const withPrismaConnectionRetry = async <T>(
  work: () => Promise<T>,
): Promise<T> => {
  let lastError: unknown;

  for (
    let attempt = 0;
    attempt < PRISMA_CONNECTION_RETRY_MAX_ATTEMPTS;
    attempt++
  ) {
    try {
      return await work();
    } catch (error) {
      lastError = error;

      if (
        attempt >= PRISMA_CONNECTION_RETRY_MAX_ATTEMPTS - 1 ||
        !isTransientDatabaseConnectionFailure(error)
      ) {
        throw error;
      }
    }
  }

  throw lastError;
};

export const extendPrismaClientWithConnectionRetry = (
  client: PrismaClient,
): PrismaClient =>
  client.$extends({
    query: {
      $allModels: {
        $allOperations: async ({ args, query }) =>
          withPrismaConnectionRetry(() => query(args)),
      },
    },
  }) as unknown as PrismaClient;
