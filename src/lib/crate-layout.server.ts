import { randomUUID } from "node:crypto";
import { CRATE_LAYOUT_SORT_STEP } from "src/constants/crate";
import { getPrependCrateLayoutSortOrder } from "src/lib/crate-layout";
import { type DbTransaction, ormTimestamp } from "src/lib/db";
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
  tx: DbTransaction;
  userId: number;
  crateId: string;
  update: ParsedCrateLayoutUpdate;
}) => {
  const txOrm = tx.orm.public;

  for (const releaseOrder of update.releaseOrders) {
    await txOrm.CrateReleases.where({
      userId,
      crateId,
      instanceId: releaseOrder.instance_id,
    }).update({ sortOrder: releaseOrder.sort_order });
  }

  let markerDeleteQuery = txOrm.CrateSetMarkers.where({ userId, crateId });
  if (update.markerIdsToKeep.length > 0) {
    markerDeleteQuery = markerDeleteQuery.where((m) =>
      m.id.notIn(update.markerIdsToKeep),
    );
  }
  await markerDeleteQuery.deleteAndCount();

  for (const marker of update.markersToUpsert) {
    const now = ormTimestamp(new Date());
    await txOrm.CrateSetMarkers.upsert({
      create: {
        userId,
        crateId,
        id: marker.id,
        label: marker.label,
        sortOrder: marker.sort_order,
        updatedAt: now,
      },
      update: {
        label: marker.label,
        sortOrder: marker.sort_order,
        updatedAt: now,
      },
      conflictOn: { userId, crateId, id: marker.id },
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
  tx: DbTransaction;
}): Promise<number> => {
  const txOrm = tx.orm.public;

  const [releaseAgg, markerAgg] = await Promise.all([
    txOrm.CrateReleases.where({ userId, crateId }).aggregate((agg) => ({
      minSortOrder: agg.min("sortOrder"),
    })),
    txOrm.CrateSetMarkers.where({ userId, crateId }).aggregate((agg) => ({
      minSortOrder: agg.min("sortOrder"),
    })),
  ]);

  const existingSortOrders = [
    releaseAgg.minSortOrder,
    markerAgg.minSortOrder,
  ].filter((sortOrder): sortOrder is number => sortOrder != null);

  return getPrependCrateLayoutSortOrder(existingSortOrders);
};
