import type { jest } from "@jest/globals";
import type { Prisma } from "@prisma/client";

type JestMockFn = jest.Mock<(...args: unknown[]) => unknown>;

export type CrateLayoutMarkerReferenceClearTx = {
  crateRelease: { updateMany: JestMockFn };
  crateSetMarker: { updateMany: JestMockFn };
};

export type CrateLayoutApplyUpdateTx = {
  crateRelease: { update: JestMockFn; updateMany: JestMockFn };
  crateSetMarker: {
    updateMany: JestMockFn;
    deleteMany: JestMockFn;
    upsert: JestMockFn;
  };
};

export const asPrismaTransactionClient = (
  tx: CrateLayoutMarkerReferenceClearTx | CrateLayoutApplyUpdateTx,
): Prisma.TransactionClient => tx as unknown as Prisma.TransactionClient;

export const crateLayoutMarkerReferenceClearTx = (
  releaseUpdateMany: JestMockFn,
  markerUpdateMany: JestMockFn,
): Prisma.TransactionClient =>
  asPrismaTransactionClient({
    crateRelease: { updateMany: releaseUpdateMany },
    crateSetMarker: { updateMany: markerUpdateMany },
  });

export const crateLayoutApplyUpdateTx = (
  releaseUpdate: JestMockFn,
  releaseUpdateMany: JestMockFn,
  markerUpdateMany: JestMockFn,
  markerDeleteMany: JestMockFn,
  markerUpsert: JestMockFn,
): Prisma.TransactionClient =>
  asPrismaTransactionClient({
    crateRelease: { update: releaseUpdate, updateMany: releaseUpdateMany },
    crateSetMarker: {
      updateMany: markerUpdateMany,
      deleteMany: markerDeleteMany,
      upsert: markerUpsert,
    },
  });
