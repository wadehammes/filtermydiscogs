import type { jest } from "@jest/globals";

export function runPrismaTransactionWith(
  mockTransaction: jest.Mock,
  tx: unknown,
) {
  mockTransaction.mockImplementation(async (callback) => {
    if (typeof callback !== "function") {
      throw new TypeError("Expected a Prisma transaction callback");
    }

    return callback(tx);
  });
}
