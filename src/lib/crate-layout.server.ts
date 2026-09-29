import { randomUUID } from "node:crypto";
import {
  CRATE_LAYOUT_SORT_STEP,
  CRATE_TEMP_MARKER_PREFIX,
} from "src/constants/crate";
import { getPrependCrateLayoutSortOrder } from "src/lib/crate-layout";
import {
  resolveCrateLayoutSectionIds,
  validateCrateLayoutSectionStructure,
} from "src/lib/crate-section-layout";
import { type DbTransaction, ormTimestamp } from "src/lib/db";
import type {
  CrateLayoutItem,
  CrateLayoutPutItem,
  CrateLayoutReleaseItem,
} from "src/types/crate.types";

export type ParsedCrateLayoutUpdate = {
  releaseOrders: Array<{
    instance_id: string;
    sort_order: number;
    section_id: string | null;
  }>;
  markersToUpsert: Array<{
    id: string;
    label: string;
    sort_order: number;
    parent_id: string | null;
    accent_key: string | null;
  }>;
  markerIdsToKeep: string[];
};

const layoutReleaseStub = (
  instanceId: string,
  sortOrder: number,
  sectionId: string | null,
): CrateLayoutReleaseItem => ({
  kind: "release",
  instance_id: instanceId,
  sort_order: sortOrder,
  section_id: sectionId,
  release: { instance_id: instanceId } as CrateLayoutReleaseItem["release"],
  found_at: null,
});

const isCreatableLayoutMarkerId = (
  markerId: string,
  existingMarkerIds: Set<string>,
): boolean =>
  !existingMarkerIds.has(markerId) &&
  markerId.startsWith(CRATE_TEMP_MARKER_PREFIX);

export const buildCrateLayoutUpdate = ({
  items,
  crateInstanceIds,
  existingMarkerIds,
}: {
  items: CrateLayoutPutItem[];
  crateInstanceIds: Set<string>;
  existingMarkerIds: Set<string>;
}): { data: ParsedCrateLayoutUpdate } | { error: string } => {
  const releaseOrders: ParsedCrateLayoutUpdate["releaseOrders"] = [];
  const seenReleaseIds = new Set<string>();
  const markersToUpsert: ParsedCrateLayoutUpdate["markersToUpsert"] = [];
  const markerIdsToKeep: string[] = [];
  const layoutScratch: CrateLayoutItem[] = [];

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

      layoutScratch.push(
        layoutReleaseStub(item.instance_id, sortOrder, item.section_id ?? null),
      );

      releaseOrders.push({
        instance_id: item.instance_id,
        sort_order: sortOrder,
        section_id: item.section_id ?? null,
      });
      continue;
    }

    const markerId = "id" in item ? item.id : randomUUID();
    if ("id" in item && !existingMarkerIds.has(item.id)) {
      if (!isCreatableLayoutMarkerId(item.id, existingMarkerIds)) {
        return { error: `Marker ${item.id} was not found in this crate` };
      }
    }

    markerIdsToKeep.push(markerId);
    markersToUpsert.push({
      id: markerId,
      label: item.label,
      sort_order: sortOrder,
      parent_id: item.parent_id ?? null,
      accent_key: item.accent_key ?? null,
    });

    layoutScratch.push({
      kind: "marker",
      id: markerId,
      label: item.label,
      sort_order: sortOrder,
      parent_id: item.parent_id ?? null,
      accent_key: item.accent_key ?? null,
    });
  }

  if (seenReleaseIds.size !== crateInstanceIds.size) {
    return { error: "Layout must include every release in the crate" };
  }

  const inferredSections = new Map(
    resolveCrateLayoutSectionIds(layoutScratch).map((row) => [
      row.instance_id,
      row.section_id,
    ]),
  );

  const resolvedReleaseOrders = releaseOrders.map((releaseOrder) => ({
    ...releaseOrder,
    section_id: inferredSections.get(releaseOrder.instance_id) ?? null,
  }));

  const resolvedLayoutScratch = layoutScratch.map((layoutItem) => {
    if (layoutItem.kind !== "release") {
      return layoutItem;
    }

    return {
      ...layoutItem,
      section_id: inferredSections.get(layoutItem.instance_id) ?? null,
    };
  });

  const structure = validateCrateLayoutSectionStructure(resolvedLayoutScratch);

  if (!structure.ok) {
    return { error: structure.error };
  }

  return {
    data: {
      releaseOrders: resolvedReleaseOrders,
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
    }).update({
      sortOrder: releaseOrder.sort_order,
      sectionId: releaseOrder.section_id,
    });
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
        parentId: marker.parent_id,
        accentKey: marker.accent_key,
        updatedAt: now,
      },
      update: {
        label: marker.label,
        sortOrder: marker.sort_order,
        parentId: marker.parent_id,
        accentKey: marker.accent_key,
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
