import type { jest } from "@jest/globals";

type AsyncMockFn<TResult> = jest.Mock<(...args: unknown[]) => Promise<TResult>>;

export const mockPrismaDelegate = <TResult>(
  mocked: jest.MockedFunction<(...args: never[]) => unknown>,
): AsyncMockFn<TResult> => mocked as unknown as AsyncMockFn<TResult>;

export type PrismaInteractiveTransactionCallback = (
  tx: unknown,
) => Promise<unknown>;

export const mockPrismaInteractiveTransaction = (
  mocked: jest.MockedFunction<typeof import("src/lib/db").prisma.$transaction>,
): jest.Mock<
  (callback: PrismaInteractiveTransactionCallback) => Promise<unknown>
> =>
  mocked as unknown as jest.Mock<
    (callback: PrismaInteractiveTransactionCallback) => Promise<unknown>
  >;
