import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { CRATE_LAYOUT_SORT_STEP } from "src/constants/crate";
import { getPrependCrateLayoutSortOrder } from "src/lib/crate-layout";
import type { CrateLayoutPutItem } from "src/types/crate.types";

export type ParsedCrateLayoutUpdate = {
  releaseOrders: Array<{ instance_id: string; sort_order: number }>;
  markersToUpsert: Array<{
    id: string;
    label: string;
    sort_order: number;
  }>;
  markerIdsToKeep: string[];
};

export const buildCrateLayoutUpdate = ({
  items,
  crateInstanceIds,
  existingMarkerIds,
}: {
  items: CrateLayoutPutItem[];
  crateInstanceIds: Set<string>;
  existingMarkerIds: Set<string>;
}): { data: ParsedCrateLayoutUpdate } | { error: string } => {
  const releaseOrders: Array<{ instance_id: string; sort_order: number }> = [];
  const seenReleaseIds = new Set<string>();
  const markersToUpsert: ParsedCrateLayoutUpdate["markersToUpsert"] = [];
  const markerIdsToKeep: string[] = [];

  for (const [index, item] of items.entries()) {
    const sortOrder = (index + 1) * CRATE_LAYOUT_SORT_STEP;

    if (item.kind === "release") {
      if (seenReleaseIds.has(item.instance_id)) {
        return { error: "Each release may appear only once in the layout" };
      }

      if (!crateInstanceIds.has(item.instance_id)) {
        return { error: `Release ${item.instance_id} is not in this crate` };
      }

      seenReleaseIds.add(item.instance_id);
      releaseOrders.push({
        instance_id: item.instance_id,
        sort_order: sortOrder,
      });
      continue;
    }

    const markerId = "id" in item ? item.id : randomUUID();
    if ("id" in item && !existingMarkerIds.has(item.id)) {
      return { error: `Marker ${item.id} was not found in this crate` };
    }

    markerIdsToKeep.push(markerId);
    markersToUpsert.push({
      id: markerId,
      label: item.label,
      sort_order: sortOrder,
    });
  }

  if (seenReleaseIds.size !== crateInstanceIds.size) {
    return { error: "Layout must include every release in the crate" };
  }

  return {
    data: {
      releaseOrders,
      markersToUpsert,
      markerIdsToKeep,
    },
  };
};

export const applyCrateLayoutUpdate = async ({
  tx,
  userId,
  crateId,
  update,
}: {
  tx: Prisma.TransactionClient;
  userId: number;
  crateId: string;
  update: ParsedCrateLayoutUpdate;
}) => {
  for (const releaseOrder of update.releaseOrders) {
    await tx.crateRelease.update({
      where: {
        user_id_crate_id_instance_id: {
          user_id: userId,
          crate_id: crateId,
          instance_id: releaseOrder.instance_id,
        },
      },
      data: {
        sort_order: releaseOrder.sort_order,
      },
    });
  }

  await tx.crateSetMarker.deleteMany({
    where: {
      user_id: userId,
      crate_id: crateId,
      ...(update.markerIdsToKeep.length > 0
        ? { id: { notIn: update.markerIdsToKeep } }
        : {}),
    },
  });

  for (const marker of update.markersToUpsert) {
    await tx.crateSetMarker.upsert({
      where: {
        user_id_crate_id_id: {
          user_id: userId,
          crate_id: crateId,
          id: marker.id,
        },
      },
      create: {
        user_id: userId,
        crate_id: crateId,
        id: marker.id,
        label: marker.label,
        sort_order: marker.sort_order,
      },
      update: {
        label: marker.label,
        sort_order: marker.sort_order,
      },
    });
  }
};

export const getPrependCrateLayoutSortOrderForCrate = async ({
  userId,
  crateId,
  tx,
}: {
  userId: number;
  crateId: string;
  tx: Prisma.TransactionClient;
}): Promise<number> => {
  const [releaseAgg, markerAgg] = await Promise.all([
    tx.crateRelease.aggregate({
      where: { user_id: userId, crate_id: crateId },
      _min: { sort_order: true },
    }),
    tx.crateSetMarker.aggregate({
      where: { user_id: userId, crate_id: crateId },
      _min: { sort_order: true },
    }),
  ]);

  const existingSortOrders = [
    releaseAgg._min.sort_order,
    markerAgg._min.sort_order,
  ].filter((sortOrder): sortOrder is number => sortOrder != null);

  return getPrependCrateLayoutSortOrder(existingSortOrders);
};
