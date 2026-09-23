import { CRATE_SECTION_MAX_DEPTH } from "src/constants/crateSectionAccent";
import {
  type CrateLayoutSortableIndexLookup,
  getCrateLayoutListInsertIndexFromDropId,
  getCrateLayoutReleaseInstanceIdFromSortableId,
  getCrateLayoutSortableId,
  getCrateLayoutSortableIndex,
  getCrateLayoutSortableIndexLookup,
  mergeReorderedVisibleCrateLayout,
  reorderCrateLayoutItems,
  reorderCrateLayoutReleaseToVisibleInsertIndex,
  resolveCrateLayoutDropIndicator,
} from "src/lib/crate-layout";
import type {
  CrateLayoutItem,
  CrateLayoutMarkerItem,
  CrateLayoutReleaseItem,
} from "src/types/crate.types";

export type CrateLayoutMarkerMap = Map<string, CrateLayoutMarkerItem>;

export const CRATE_LAYOUT_SECTION_EMPTY_DROP_PREFIX = "section-empty:";

export const CRATE_LAYOUT_SECTION_MEMBER_END_DROP_PREFIX = "section-end:";

export const getCrateLayoutSectionEmptyDropId = (markerId: string): string =>
  `${CRATE_LAYOUT_SECTION_EMPTY_DROP_PREFIX}${markerId}`;

export const getCrateLayoutSectionMemberEndDropId = (
  markerId: string,
): string => `${CRATE_LAYOUT_SECTION_MEMBER_END_DROP_PREFIX}${markerId}`;

export const isCrateLayoutSectionReleaseDropZoneId = (id: string): boolean =>
  id.startsWith(CRATE_LAYOUT_SECTION_EMPTY_DROP_PREFIX) ||
  id.startsWith(CRATE_LAYOUT_SECTION_MEMBER_END_DROP_PREFIX);

export const getCrateLayoutMarkerIdFromSectionEmptyDropId = (
  overSortableId: string,
): string | null => {
  if (!overSortableId.startsWith(CRATE_LAYOUT_SECTION_EMPTY_DROP_PREFIX)) {
    return null;
  }

  return overSortableId.slice(CRATE_LAYOUT_SECTION_EMPTY_DROP_PREFIX.length);
};

export const getCrateLayoutMarkerIdFromSectionMemberEndDropId = (
  overSortableId: string,
): string | null => {
  if (!overSortableId.startsWith(CRATE_LAYOUT_SECTION_MEMBER_END_DROP_PREFIX)) {
    return null;
  }

  return overSortableId.slice(
    CRATE_LAYOUT_SECTION_MEMBER_END_DROP_PREFIX.length,
  );
};

export const resolveCrateLayoutForcedSectionIdForReleaseDrop = (
  overSortableId: string,
): string | undefined => {
  const memberEndMarkerId =
    getCrateLayoutMarkerIdFromSectionMemberEndDropId(overSortableId);

  if (memberEndMarkerId) {
    return memberEndMarkerId;
  }

  const emptyMarkerId =
    getCrateLayoutMarkerIdFromSectionEmptyDropId(overSortableId);

  if (emptyMarkerId) {
    return emptyMarkerId;
  }

  return undefined;
};

const normalizeCrateLayoutDragOverSortableId = (
  overSortableId: string,
): string => {
  const markerId = getCrateLayoutMarkerIdFromSectionEmptyDropId(overSortableId);

  if (markerId) {
    return `marker:${markerId}`;
  }

  return overSortableId;
};

export const filterCrateLayoutMarkerDragCollisions = <
  T extends { id: string | number },
>(
  collisions: readonly T[],
  {
    activeMarkerId,
    sectionBlockSortableIdsByMarkerId,
    items,
    sortableIndexLookup,
  }: {
    activeMarkerId: string;
    sectionBlockSortableIdsByMarkerId?: ReadonlyMap<
      string,
      ReadonlySet<string>
    >;
    items?: CrateLayoutItem[];
    sortableIndexLookup?: CrateLayoutSortableIndexLookup;
  },
): T[] => {
  const ownEmptyDropId = getCrateLayoutSectionEmptyDropId(activeMarkerId);
  const blockIds =
    sectionBlockSortableIdsByMarkerId?.get(activeMarkerId) ?? new Set<string>();

  return collisions.filter((collision) => {
    const id = String(collision.id);

    if (id.startsWith(CRATE_LAYOUT_SECTION_EMPTY_DROP_PREFIX)) {
      return id !== ownEmptyDropId;
    }

    if (id.startsWith(CRATE_LAYOUT_SECTION_MEMBER_END_DROP_PREFIX)) {
      return id !== getCrateLayoutSectionMemberEndDropId(activeMarkerId);
    }

    if (blockIds.has(id)) {
      return false;
    }

    return isCrateLayoutSectionMoveOverSortableId({
      activeMarkerId,
      overSortableId: id,
      ...(sectionBlockSortableIdsByMarkerId
        ? { sectionBlockSortableIdsByMarkerId }
        : {}),
      ...(items ? { items } : {}),
      ...(sortableIndexLookup ? { sortableIndexLookup } : {}),
    });
  });
};

export const isCrateLayoutSectionMoveOverSortableId = ({
  activeMarkerId,
  overSortableId,
  sectionBlockSortableIdsByMarkerId,
  items,
  sortableIndexLookup,
}: {
  activeMarkerId: string;
  overSortableId: string;
  sectionBlockSortableIdsByMarkerId?: ReadonlyMap<string, ReadonlySet<string>>;
  items?: CrateLayoutItem[];
  sortableIndexLookup?: CrateLayoutSortableIndexLookup;
}): boolean => {
  const normalizedOver = normalizeCrateLayoutDragOverSortableId(overSortableId);

  if (normalizedOver === `marker:${activeMarkerId}`) {
    return false;
  }

  const emptyMarkerId =
    getCrateLayoutMarkerIdFromSectionEmptyDropId(overSortableId);

  if (emptyMarkerId) {
    return emptyMarkerId !== activeMarkerId;
  }

  const endMarkerId =
    getCrateLayoutMarkerIdFromSectionMemberEndDropId(overSortableId);

  if (endMarkerId) {
    if (endMarkerId === activeMarkerId) {
      return false;
    }

    if (!items) {
      return false;
    }

    const markersById = getCrateLayoutMarkerMap(items);

    if (
      isCrateLayoutMarkerDescendantOf(activeMarkerId, endMarkerId, markersById)
    ) {
      return true;
    }

    return false;
  }

  if (normalizedOver.startsWith("marker:")) {
    return true;
  }

  if (!sectionBlockSortableIdsByMarkerId) {
    return true;
  }

  const lookup =
    items && sortableIndexLookup
      ? sortableIndexLookup
      : items
        ? getCrateLayoutSortableIndexLookup(items)
        : undefined;

  for (const [
    markerId,
    blockSortableIds,
  ] of sectionBlockSortableIdsByMarkerId) {
    if (markerId === activeMarkerId) {
      continue;
    }

    if (!blockSortableIds.has(normalizedOver)) {
      continue;
    }

    if (items && normalizedOver.startsWith("release:") && lookup) {
      const overIndex = getCrateLayoutSortableIndex({
        items,
        sortableId: normalizedOver,
        lookup,
      });

      if (
        overIndex >= 0 &&
        isCrateLayoutReleaseMemberOfSection(items, overIndex, markerId)
      ) {
        if (blockSortableIds.has(`marker:${activeMarkerId}`)) {
          return true;
        }

        return false;
      }

      continue;
    }

    return false;
  }

  return true;
};

export const getCrateLayoutMarkerMap = (
  items: CrateLayoutItem[],
): CrateLayoutMarkerMap => {
  const map: CrateLayoutMarkerMap = new Map();

  for (const item of items) {
    if (item.kind === "marker") {
      map.set(item.id, item);
    }
  }

  return map;
};

export const getCrateLayoutSectionDepth = (
  markerId: string,
  markersById: CrateLayoutMarkerMap,
): number => {
  let depth = 0;
  let current = markersById.get(markerId);

  while (current?.parent_id) {
    depth += 1;
    current = markersById.get(current.parent_id);
  }

  return depth;
};

export const isCrateLayoutMarkerDescendantOf = (
  markerId: string,
  ancestorId: string,
  markersById: CrateLayoutMarkerMap,
): boolean => {
  let current = markersById.get(markerId);

  while (current?.parent_id) {
    if (current.parent_id === ancestorId) {
      return true;
    }

    current = markersById.get(current.parent_id);
  }

  return false;
};

const markerClosesSection = ({
  item,
  sectionMarkerId,
  markersById,
}: {
  item: CrateLayoutMarkerItem;
  sectionMarkerId: string;
  markersById: CrateLayoutMarkerMap;
}): boolean => {
  if (item.id === sectionMarkerId) {
    return false;
  }

  if (isCrateLayoutMarkerDescendantOf(item.id, sectionMarkerId, markersById)) {
    return false;
  }

  return true;
};

export const getCrateLayoutSectionBlock = ({
  items,
  markerId,
  markersById,
  markerIndex,
}: {
  items: CrateLayoutItem[];
  markerId: string;
  markersById?: CrateLayoutMarkerMap;
  markerIndex?: number;
}): CrateLayoutItem[] => {
  const markers = markersById ?? getCrateLayoutMarkerMap(items);
  const startIndex =
    markerIndex ??
    items.findIndex((item) => item.kind === "marker" && item.id === markerId);

  if (startIndex < 0) {
    return [];
  }

  const block: CrateLayoutItem[] = [];
  const startItem = items[startIndex];

  if (startItem?.kind !== "marker") {
    return block;
  }

  block.push(startItem);

  for (let index = startIndex + 1; index < items.length; index += 1) {
    const item = items[index];

    if (!item) {
      continue;
    }

    if (
      item.kind === "marker" &&
      markerClosesSection({
        item,
        sectionMarkerId: markerId,
        markersById: markers,
      })
    ) {
      break;
    }

    if (item.kind === "release" && startItem.parent_id) {
      const belongsToSubsection =
        item.section_id === markerId ||
        (item.section_id != null &&
          isCrateLayoutMarkerDescendantOf(item.section_id, markerId, markers));

      if (!belongsToSubsection) {
        break;
      }
    }

    block.push(item);
  }

  return block;
};

const inferCrateLayoutMarkerParentId = (
  items: CrateLayoutItem[],
  markerId: string,
): string | null => {
  const markerIndex = items.findIndex(
    (item) => item.kind === "marker" && item.id === markerId,
  );

  if (markerIndex <= 0) {
    return null;
  }

  for (let index = markerIndex - 1; index >= 0; index -= 1) {
    const item = items[index];

    if (item?.kind !== "marker") {
      continue;
    }

    const block = getCrateLayoutSectionBlock({
      items,
      markerId: item.id,
      markerIndex: index,
    });
    const blockEndIndex = index + block.length - 1;

    if (markerIndex <= blockEndIndex) {
      return item.id;
    }
  }

  return null;
};

const applyMovedSectionBlockMarkerParentIds = (
  items: CrateLayoutItem[],
  movedBlock: CrateLayoutItem[],
): CrateLayoutItem[] => {
  const markerIdsInBlock = new Set(
    movedBlock.filter((item) => item.kind === "marker").map((item) => item.id),
  );

  if (markerIdsInBlock.size === 0) {
    return items;
  }

  return items.map((item) => {
    if (item.kind !== "marker" || !markerIdsInBlock.has(item.id)) {
      return item;
    }

    return {
      ...item,
      parent_id: inferCrateLayoutMarkerParentId(items, item.id),
    };
  });
};

export const insertCrateLayoutSubsectionMarker = ({
  fullItems,
  parentMarkerId,
  marker,
}: {
  fullItems: CrateLayoutItem[];
  parentMarkerId: string;
  marker: CrateLayoutMarkerItem;
}): CrateLayoutItem[] => {
  const parentIndex = fullItems.findIndex(
    (item) => item.kind === "marker" && item.id === parentMarkerId,
  );

  if (parentIndex < 0) {
    return [...fullItems, { ...marker, parent_id: parentMarkerId }];
  }

  const block = getCrateLayoutSectionBlock({
    items: fullItems,
    markerId: parentMarkerId,
  });
  const lastBlockItem = block[block.length - 1];
  const insertAfterIndex =
    lastBlockItem === undefined
      ? parentIndex
      : fullItems.findIndex(
          (item) =>
            getCrateLayoutSortableId(item) ===
            getCrateLayoutSortableId(lastBlockItem),
        );

  if (insertAfterIndex < 0) {
    return [...fullItems, { ...marker, parent_id: parentMarkerId }];
  }

  const nextItems = [...fullItems];
  nextItems.splice(insertAfterIndex + 1, 0, {
    ...marker,
    parent_id: parentMarkerId,
  });

  return nextItems;
};

export type CrateLayoutLooseSegment = {
  kind: "loose";
  item: CrateLayoutReleaseItem;
  itemIndex: number;
  showInsertAfter: boolean;
};

export type CrateLayoutSectionSegment = {
  kind: "section";
  marker: CrateLayoutMarkerItem;
  block: CrateLayoutItem[];
  startIndex: number;
  bodySegments: CrateLayoutRenderSegment[];
  showInsertAfter: boolean;
  insertAfterIndex: number;
  suppressMemberEndDrop?: boolean;
};

export type CrateLayoutRenderSegment =
  | CrateLayoutLooseSegment
  | CrateLayoutSectionSegment;

export const getCrateLayoutRenderSegmentKey = (
  segment: CrateLayoutRenderSegment,
): string =>
  segment.kind === "loose" ? segment.item.instance_id : segment.marker.id;

export const shouldShowCrateLayoutSectionMemberEndDropZone = (
  bodySegments: readonly CrateLayoutRenderSegment[],
): boolean => bodySegments.length > 0;

export const getCrateLayoutInsertIndexAtSectionBodyTail = (
  items: CrateLayoutItem[],
  sectionMarkerId: string,
): number => {
  const blockStart = items.findIndex(
    (item) => item.kind === "marker" && item.id === sectionMarkerId,
  );

  if (blockStart < 0) {
    return items.length;
  }

  const block = getCrateLayoutSectionBlock({
    items,
    markerId: sectionMarkerId,
    markerIndex: blockStart,
  });

  return blockStart + block.length;
};

export const shouldShowCrateLayoutInsertZoneAtSectionBodyTail = (
  bodySegments: readonly CrateLayoutRenderSegment[],
): boolean => {
  if (bodySegments.length === 0) {
    return false;
  }

  return bodySegments[bodySegments.length - 1]?.kind === "section";
};

const getCrateLayoutInsertIndexAfterSectionBlock = ({
  items,
  blockStart,
  block,
  sectionMarkerId,
}: {
  items: CrateLayoutItem[];
  blockStart: number;
  block: CrateLayoutItem[];
  sectionMarkerId: string;
}): number => {
  for (let blockOffset = 1; blockOffset < block.length; blockOffset += 1) {
    const inner = block[blockOffset];

    if (inner?.kind !== "release") {
      continue;
    }

    const innerIndex = blockStart + blockOffset;

    if (
      !isCrateLayoutReleaseMemberOfSection(items, innerIndex, sectionMarkerId)
    ) {
      return innerIndex;
    }
  }

  return blockStart + block.length;
};

const getCrateLayoutSectionInsertZoneAfterNestedInParentBody = ({
  items,
  nestedBlockStart,
  nestedBlock,
  nestedMarkerId,
  parentSectionBlockEndIndex,
}: {
  items: CrateLayoutItem[];
  nestedBlockStart: number;
  nestedBlock: CrateLayoutItem[];
  nestedMarkerId: string;
  parentSectionBlockEndIndex: number;
}): { showInsertAfter: boolean; insertAfterIndex: number } => {
  const insertZone = getCrateLayoutSectionInsertZoneAfterBlock({
    items,
    blockStart: nestedBlockStart,
    block: nestedBlock,
    sectionMarkerId: nestedMarkerId,
  });

  if (insertZone.showInsertAfter) {
    return insertZone;
  }

  const nestedBlockEndIndex = nestedBlockStart + nestedBlock.length - 1;

  if (nestedBlockEndIndex !== parentSectionBlockEndIndex) {
    return insertZone;
  }

  return {
    showInsertAfter: true,
    insertAfterIndex: nestedBlockStart + nestedBlock.length,
  };
};

const getCrateLayoutSectionInsertZoneAfterBlock = ({
  items,
  blockStart,
  block,
  sectionMarkerId,
}: {
  items: CrateLayoutItem[];
  blockStart: number;
  block: CrateLayoutItem[];
  sectionMarkerId: string;
}): { showInsertAfter: boolean; insertAfterIndex: number } => {
  const insertAfterIndex = getCrateLayoutInsertIndexAfterSectionBlock({
    items,
    blockStart,
    block,
    sectionMarkerId,
  });

  return {
    showInsertAfter: insertAfterIndex < items.length,
    insertAfterIndex,
  };
};

export const shouldShowCrateLayoutInsertZoneAfterLooseInLayout = (
  items: CrateLayoutItem[],
  itemIndex: number,
  enclosingSection?: {
    sectionMarkerId: string;
    sectionBlockEndIndex: number;
    markersById: CrateLayoutMarkerMap;
  },
): boolean => {
  const nextIndex = itemIndex + 1;

  if (nextIndex >= items.length) {
    return false;
  }

  const nextItem = items[nextIndex];

  if (!nextItem) {
    return false;
  }

  if (!enclosingSection) {
    return true;
  }

  if (nextIndex > enclosingSection.sectionBlockEndIndex) {
    return false;
  }

  if (nextItem.kind === "marker") {
    return isCrateLayoutMarkerDescendantOf(
      nextItem.id,
      enclosingSection.sectionMarkerId,
      enclosingSection.markersById,
    );
  }

  if (nextItem.kind === "release") {
    return isCrateLayoutReleaseMemberOfSection(
      items,
      nextIndex,
      enclosingSection.sectionMarkerId,
    );
  }

  return false;
};

const toCrateLayoutLooseSegment = (
  items: CrateLayoutItem[],
  item: CrateLayoutReleaseItem,
  itemIndex: number,
  ctx: CrateLayoutRenderBuildContext,
  enclosingSection?: {
    markerId: string;
    blockEndIndex: number;
  },
): CrateLayoutLooseSegment => ({
  kind: "loose",
  item,
  itemIndex,
  showInsertAfter: shouldShowCrateLayoutInsertZoneAfterLooseInLayout(
    items,
    itemIndex,
    enclosingSection
      ? {
          sectionMarkerId: enclosingSection.markerId,
          sectionBlockEndIndex: enclosingSection.blockEndIndex,
          markersById: ctx.markersById,
        }
      : undefined,
  ),
});

export type CrateLayoutRenderBuildContext = Readonly<{
  markersById: CrateLayoutMarkerMap;
  sortableIndexLookup: CrateLayoutSortableIndexLookup;
}>;

export const createCrateLayoutRenderBuildContext = (
  items: CrateLayoutItem[],
): CrateLayoutRenderBuildContext => ({
  markersById: getCrateLayoutMarkerMap(items),
  sortableIndexLookup: getCrateLayoutSortableIndexLookup(items),
});

export const getCrateLayoutSectionBlockSortableIdsByMarkerId = (
  items: CrateLayoutItem[],
  ctx: CrateLayoutRenderBuildContext,
): ReadonlyMap<string, ReadonlySet<string>> => {
  const { markersById, sortableIndexLookup } = ctx;
  const byMarkerId = new Map<string, ReadonlySet<string>>();

  for (const [markerId, markerIndex] of sortableIndexLookup.indexByMarkerId) {
    const block = getCrateLayoutSectionBlock({
      items,
      markerId,
      markersById,
      markerIndex,
    });
    byMarkerId.set(
      markerId,
      new Set(block.map((item) => getCrateLayoutSortableId(item))),
    );
  }

  return byMarkerId;
};

export const buildVisibleCrateLayoutRenderBundle = (
  items: CrateLayoutItem[],
) => {
  const ctx = createCrateLayoutRenderBuildContext(items);

  return {
    markerMap: ctx.markersById,
    sortableIndexLookup: ctx.sortableIndexLookup,
    sortableIds: [...ctx.sortableIndexLookup.sortableIds],
    layoutSegments: buildCrateLayoutRenderSegments(items, ctx),
    sectionBlockSortableIdsByMarkerId:
      getCrateLayoutSectionBlockSortableIdsByMarkerId(items, ctx),
  };
};

export const shouldShowCrateLayoutInsertZoneAfterIndex = (
  items: CrateLayoutItem[],
  itemIndex: number,
): boolean =>
  shouldShowCrateLayoutInsertZoneAfterLooseInLayout(items, itemIndex);

export const buildCrateLayoutSectionBodySegments = (
  items: CrateLayoutItem[],
  sectionRenderBlock: CrateLayoutItem[],
  parentMarkerId: string,
  ctx: CrateLayoutRenderBuildContext,
  sectionBlockStartIndex: number,
): CrateLayoutRenderSegment[] => {
  const { markersById, sortableIndexLookup } = ctx;
  const sectionBlockEndIndex =
    sectionBlockStartIndex + sectionRenderBlock.length - 1;
  const segments: CrateLayoutRenderSegment[] = [];
  let offset = 1;

  while (offset < sectionRenderBlock.length) {
    const inner = sectionRenderBlock[offset];

    if (!inner) {
      offset += 1;
      continue;
    }

    if (inner.kind === "marker") {
      if (
        !isCrateLayoutMarkerDescendantOf(inner.id, parentMarkerId, markersById)
      ) {
        offset += 1;
        continue;
      }

      const nestedBlock = buildCrateLayoutSectionRenderBlock(
        items,
        inner.id,
        undefined,
        ctx,
      );
      const nestedStart =
        sortableIndexLookup.indexByMarkerId.get(inner.id) ?? -1;

      if (nestedStart < 0) {
        offset += 1;
        continue;
      }

      const insertZone = getCrateLayoutSectionInsertZoneAfterNestedInParentBody(
        {
          items,
          nestedBlockStart: nestedStart,
          nestedBlock,
          nestedMarkerId: inner.id,
          parentSectionBlockEndIndex: sectionBlockEndIndex,
        },
      );

      segments.push({
        kind: "section",
        marker: inner,
        block: nestedBlock,
        startIndex: nestedStart,
        bodySegments: buildCrateLayoutSectionBodySegments(
          items,
          nestedBlock,
          inner.id,
          ctx,
          nestedStart,
        ),
        suppressMemberEndDrop:
          nestedStart + nestedBlock.length - 1 === sectionBlockEndIndex,
        ...insertZone,
      });
      offset += nestedBlock.length;
      continue;
    }

    if (inner.kind === "release") {
      const itemIndex =
        sortableIndexLookup.indexByInstanceId.get(inner.instance_id) ?? -1;

      if (itemIndex < 0) {
        offset += 1;
        continue;
      }

      segments.push(
        toCrateLayoutLooseSegment(items, inner, itemIndex, ctx, {
          markerId: parentMarkerId,
          blockEndIndex: sectionBlockEndIndex,
        }),
      );
      offset += 1;
      continue;
    }

    offset += 1;
  }

  return segments;
};

const hasMemberThenGapBeforeRelease = (
  items: CrateLayoutItem[],
  sectionId: string,
  releaseIndex: number,
  markersById: CrateLayoutMarkerMap,
): boolean => {
  const markerIndex = items.findIndex(
    (item) => item.kind === "marker" && item.id === sectionId,
  );

  if (markerIndex < 0 || releaseIndex <= markerIndex) {
    return false;
  }

  let sawMember = false;

  for (let index = markerIndex + 1; index < releaseIndex; index += 1) {
    const item = items[index];

    if (item?.kind !== "release") {
      continue;
    }

    if (item.section_id === sectionId) {
      sawMember = true;
      continue;
    }

    const isUnsectioned =
      item.section_id == null || !markersById.has(item.section_id);

    if (sawMember && isUnsectioned) {
      return true;
    }
  }

  return false;
};

const isReleaseInSectionBlock = (
  items: CrateLayoutItem[],
  releaseIndex: number,
  sectionId: string,
  markersById: CrateLayoutMarkerMap = getCrateLayoutMarkerMap(items),
): boolean => {
  const release = items[releaseIndex];

  if (release?.kind !== "release") {
    return false;
  }

  if (!markersById.has(sectionId)) {
    return false;
  }

  const block = getCrateLayoutSectionBlock({ items, markerId: sectionId });

  if (
    !block.some(
      (item) =>
        item.kind === "release" && item.instance_id === release.instance_id,
    )
  ) {
    return false;
  }

  if (
    hasMemberThenGapBeforeRelease(items, sectionId, releaseIndex, markersById)
  ) {
    return false;
  }

  return true;
};

const resolveValidatedReleaseSectionId = (
  items: CrateLayoutItem[],
  releaseIndex: number,
  sectionId: string | null,
  markersById: CrateLayoutMarkerMap = getCrateLayoutMarkerMap(items),
): string | null => {
  if (!sectionId) {
    return null;
  }

  if (!markersById.has(sectionId)) {
    return null;
  }

  return isReleaseInSectionBlock(items, releaseIndex, sectionId, markersById)
    ? sectionId
    : null;
};

export const inferCrateLayoutSectionIdForReleaseIndex = (
  items: CrateLayoutItem[],
  releaseIndex: number,
): string | null => {
  const release = items[releaseIndex];

  if (release?.kind !== "release") {
    return null;
  }

  const previous = items[releaseIndex - 1];

  if (!previous) {
    return null;
  }

  if (previous.kind === "marker") {
    return resolveValidatedReleaseSectionId(items, releaseIndex, previous.id);
  }

  if (previous.kind === "release" && previous.section_id) {
    const next = items[releaseIndex + 1];
    const markersById = getCrateLayoutMarkerMap(items);

    if (
      next?.kind === "release" &&
      (next.section_id == null || !markersById.has(next.section_id))
    ) {
      return null;
    }

    return resolveValidatedReleaseSectionId(
      items,
      releaseIndex,
      previous.section_id,
    );
  }

  return null;
};

export const isCrateLayoutReleaseMemberOfSection = (
  items: CrateLayoutItem[],
  releaseIndex: number,
  sectionMarkerId: string,
): boolean => {
  const release = items[releaseIndex];

  if (release?.kind !== "release") {
    return false;
  }

  return (
    resolveValidatedReleaseSectionId(
      items,
      releaseIndex,
      release.section_id,
    ) === sectionMarkerId
  );
};

export const buildCrateLayoutSectionRenderBlock = (
  items: CrateLayoutItem[],
  markerId: string,
  sectionBlock?: CrateLayoutItem[],
  ctx?: CrateLayoutRenderBuildContext,
): CrateLayoutItem[] => {
  const markersById = ctx?.markersById ?? getCrateLayoutMarkerMap(items);
  const blockStart =
    ctx?.sortableIndexLookup.indexByMarkerId.get(markerId) ??
    items.findIndex((item) => item.kind === "marker" && item.id === markerId);

  if (blockStart < 0) {
    return [];
  }

  const block =
    sectionBlock ??
    getCrateLayoutSectionBlock({
      items,
      markerId,
      markersById,
      markerIndex: blockStart,
    });
  const rootMarker = block[0];

  if (rootMarker?.kind !== "marker") {
    return [];
  }

  const sectionRenderBlock: CrateLayoutItem[] = [rootMarker];

  for (let blockOffset = 1; blockOffset < block.length; ) {
    const inner = block[blockOffset];

    if (!inner) {
      blockOffset += 1;
      continue;
    }

    if (inner.kind === "marker") {
      if (
        !isCrateLayoutMarkerDescendantOf(inner.id, rootMarker.id, markersById)
      ) {
        blockOffset += 1;
        continue;
      }

      sectionRenderBlock.push(
        ...buildCrateLayoutSectionRenderBlock(items, inner.id, undefined, ctx),
      );
      blockOffset += 1;
      continue;
    }

    if (inner.kind === "release") {
      const innerIndex = blockStart + blockOffset;

      if (
        isCrateLayoutReleaseMemberOfSection(items, innerIndex, rootMarker.id)
      ) {
        sectionRenderBlock.push(inner);
      }

      blockOffset += 1;
      continue;
    }

    blockOffset += 1;
  }

  return sectionRenderBlock;
};

export const buildCrateLayoutRenderSegments = (
  items: CrateLayoutItem[],
  ctx: CrateLayoutRenderBuildContext = createCrateLayoutRenderBuildContext(
    items,
  ),
): CrateLayoutRenderSegment[] => {
  const { markersById } = ctx;
  const segments: CrateLayoutRenderSegment[] = [];
  let index = 0;

  while (index < items.length) {
    const item = items[index];

    if (!item) {
      index += 1;
      continue;
    }

    if (item.kind === "marker") {
      const blockStart = index;
      const block = getCrateLayoutSectionBlock({
        items,
        markerId: item.id,
        markersById,
        markerIndex: blockStart,
      });
      const sectionRenderBlock = buildCrateLayoutSectionRenderBlock(
        items,
        item.id,
        block,
        ctx,
      );

      const insertZone = getCrateLayoutSectionInsertZoneAfterBlock({
        items,
        blockStart,
        block,
        sectionMarkerId: item.id,
      });

      segments.push({
        kind: "section",
        marker: item,
        block: sectionRenderBlock,
        startIndex: blockStart,
        bodySegments: buildCrateLayoutSectionBodySegments(
          items,
          sectionRenderBlock,
          item.id,
          ctx,
          blockStart,
        ),
        ...insertZone,
      });

      for (let blockOffset = 1; blockOffset < block.length; blockOffset += 1) {
        const inner = block[blockOffset];

        if (inner?.kind !== "release") {
          continue;
        }

        const innerIndex = blockStart + blockOffset;

        if (!isCrateLayoutReleaseMemberOfSection(items, innerIndex, item.id)) {
          const releaseSectionId =
            inner.kind === "release" ? inner.section_id : null;

          if (
            releaseSectionId &&
            isCrateLayoutMarkerDescendantOf(
              releaseSectionId,
              item.id,
              markersById,
            )
          ) {
            continue;
          }

          segments.push(
            toCrateLayoutLooseSegment(items, inner, innerIndex, ctx),
          );
        }
      }

      index = blockStart + block.length;
      continue;
    }

    segments.push(toCrateLayoutLooseSegment(items, item, index, ctx));
    index += 1;
  }

  return segments;
};

const resolveCrateLayoutReleaseOverMarkerInsertBefore = ({
  items,
  activeSortableId,
  markerId,
  sortableIndexLookup,
  sectionBlockSortableIdsByMarkerId,
}: {
  items: CrateLayoutItem[];
  activeSortableId: string;
  markerId: string;
  sortableIndexLookup?: CrateLayoutSortableIndexLookup;
  sectionBlockSortableIdsByMarkerId?: ReadonlyMap<string, ReadonlySet<string>>;
}): boolean | null => {
  const activeIndex = sortableIndexLookup
    ? getCrateLayoutSortableIndex({
        items,
        sortableId: activeSortableId,
        lookup: sortableIndexLookup,
      })
    : getCrateLayoutSortableIndex({ items, sortableId: activeSortableId });
  const markerIndex = sortableIndexLookup
    ? (sortableIndexLookup.indexByMarkerId.get(markerId) ?? -1)
    : items.findIndex((item) => item.kind === "marker" && item.id === markerId);

  if (activeIndex < 0 || markerIndex < 0) {
    return null;
  }

  const blockSortableIds =
    sectionBlockSortableIdsByMarkerId?.get(markerId) ??
    new Set(
      getCrateLayoutSectionBlock({ items, markerId }).map((blockItem) =>
        getCrateLayoutSortableId(blockItem),
      ),
    );
  const activeInSectionBlock = blockSortableIds.has(activeSortableId);

  return activeInSectionBlock || activeIndex > markerIndex;
};

export const moveCrateLayoutSectionBeforeSortableId = ({
  items,
  activeMarkerId,
  overSortableId,
  sectionBlockSortableIdsByMarkerId,
  insertBeforeOver = true,
}: {
  items: CrateLayoutItem[];
  activeMarkerId: string;
  overSortableId: string;
  sectionBlockSortableIdsByMarkerId?: ReadonlyMap<string, ReadonlySet<string>>;
  insertBeforeOver?: boolean;
}): CrateLayoutItem[] => {
  const ctx = createCrateLayoutRenderBuildContext(items);
  const blockMap =
    sectionBlockSortableIdsByMarkerId ??
    getCrateLayoutSectionBlockSortableIdsByMarkerId(items, ctx);

  if (
    !isCrateLayoutSectionMoveOverSortableId({
      activeMarkerId,
      overSortableId,
      sectionBlockSortableIdsByMarkerId: blockMap,
      items,
      sortableIndexLookup: ctx.sortableIndexLookup,
    })
  ) {
    return items;
  }

  const block = getCrateLayoutSectionBlock({ items, markerId: activeMarkerId });
  const blockIds = new Set(block.map((item) => getCrateLayoutSortableId(item)));
  const remaining = items.filter(
    (item) => !blockIds.has(getCrateLayoutSortableId(item)),
  );

  const memberEndMarkerId =
    getCrateLayoutMarkerIdFromSectionMemberEndDropId(overSortableId);

  if (memberEndMarkerId) {
    if (!ctx.sortableIndexLookup.indexByMarkerId.has(memberEndMarkerId)) {
      return items;
    }

    const targetInsertFlatIndex = getCrateLayoutInsertIndexAtSectionBodyTail(
      items,
      memberEndMarkerId,
    );
    let insertAt = 0;

    for (const item of remaining) {
      const flatIndex = getCrateLayoutSortableIndex({
        items,
        sortableId: getCrateLayoutSortableId(item),
        lookup: ctx.sortableIndexLookup,
      });

      if (flatIndex >= 0 && flatIndex < targetInsertFlatIndex) {
        insertAt += 1;
      }
    }

    const nextItems = [...remaining];
    insertAt = Math.max(0, Math.min(insertAt, nextItems.length));
    nextItems.splice(insertAt, 0, ...block);

    return applyMovedSectionBlockMarkerParentIds(nextItems, block);
  }

  const overIndex = remaining.findIndex(
    (item) =>
      getCrateLayoutSortableId(item) ===
      normalizeCrateLayoutDragOverSortableId(overSortableId),
  );

  if (overIndex < 0) {
    return items;
  }

  const nextItems = [...remaining];
  nextItems.splice(insertBeforeOver ? overIndex : overIndex + 1, 0, ...block);

  return applyMovedSectionBlockMarkerParentIds(nextItems, block);
};

export const applyResolvedCrateLayoutSectionIds = (
  items: CrateLayoutItem[],
  options?: { movedInstanceId?: string; forcedSectionId?: string },
): CrateLayoutItem[] => {
  const markersById = getCrateLayoutMarkerMap(items);
  const working = items.map((item) =>
    item.kind === "release" ? { ...item } : item,
  );

  if (options?.movedInstanceId) {
    const movedIndex = working.findIndex(
      (item) =>
        item.kind === "release" && item.instance_id === options.movedInstanceId,
    );

    if (movedIndex >= 0) {
      const moved = working[movedIndex];

      if (moved?.kind === "release") {
        if (options.forcedSectionId) {
          moved.section_id = options.forcedSectionId;
        } else {
          moved.section_id = inferCrateLayoutSectionIdForReleaseIndex(
            items,
            movedIndex,
          );
        }
      }
    }
  }

  for (let index = 0; index < working.length; index += 1) {
    const item = working[index];

    if (item?.kind !== "release") {
      continue;
    }

    item.section_id = resolveValidatedReleaseSectionId(
      working,
      index,
      item.section_id,
      markersById,
    );
  }

  return working;
};

export const reorderVisibleCrateLayoutAfterDrag = ({
  visibleItems,
  activeSortableId,
  overSortableId,
  insertBeforeOver = true,
}: {
  visibleItems: CrateLayoutItem[];
  activeSortableId: string;
  overSortableId: string;
  insertBeforeOver?: boolean;
}): {
  nextVisibleItems: CrateLayoutItem[];
  movedInstanceId?: string;
} => {
  const reorderedVisibleItems = reorderCrateLayoutVisibleSortableItems({
    visibleItems,
    activeSortableId,
    overSortableId,
    insertBeforeOver,
  });
  const movedInstanceId =
    getCrateLayoutReleaseInstanceIdFromSortableId(activeSortableId) ??
    undefined;
  const forcedSectionId = activeSortableId.startsWith("release:")
    ? resolveCrateLayoutForcedSectionIdForReleaseDrop(overSortableId)
    : undefined;

  return {
    nextVisibleItems: applyResolvedCrateLayoutSectionIds(
      reorderedVisibleItems,
      movedInstanceId
        ? {
            movedInstanceId,
            ...(forcedSectionId ? { forcedSectionId } : {}),
          }
        : undefined,
    ),
    ...(movedInstanceId ? { movedInstanceId } : {}),
  };
};

export const applyCrateLayoutListDragReorder = ({
  fullItems,
  visibleItems,
  activeSortableId,
  overSortableId,
  insertBeforeOver = true,
}: {
  fullItems: CrateLayoutItem[];
  visibleItems: CrateLayoutItem[];
  activeSortableId: string;
  overSortableId: string;
  insertBeforeOver?: boolean;
}): CrateLayoutItem[] => {
  if (activeSortableId === overSortableId) {
    return fullItems;
  }

  if (activeSortableId.startsWith("marker:")) {
    const blockMap = getCrateLayoutSectionBlockSortableIdsByMarkerId(
      visibleItems,
      createCrateLayoutRenderBuildContext(visibleItems),
    );
    const movedFullItems = moveCrateLayoutSectionBeforeSortableId({
      items: fullItems,
      activeMarkerId: activeSortableId.replace(/^marker:/, ""),
      overSortableId,
      sectionBlockSortableIdsByMarkerId: blockMap,
      insertBeforeOver,
    });

    return applyResolvedCrateLayoutSectionIds(movedFullItems);
  }

  const forcedSectionId = activeSortableId.startsWith("release:")
    ? resolveCrateLayoutForcedSectionIdForReleaseDrop(overSortableId)
    : undefined;

  const { nextVisibleItems, movedInstanceId } =
    reorderVisibleCrateLayoutAfterDrag({
      visibleItems,
      activeSortableId,
      overSortableId,
      insertBeforeOver,
    });
  const mergedItems = mergeReorderedVisibleCrateLayout({
    fullItems,
    visibleItems,
    reorderedVisibleItems: nextVisibleItems,
  });

  return applyResolvedCrateLayoutSectionIds(
    mergedItems,
    movedInstanceId
      ? {
          movedInstanceId,
          ...(forcedSectionId ? { forcedSectionId } : {}),
        }
      : undefined,
  );
};

export const reorderCrateLayoutReleaseOverSectionMarker = ({
  items,
  activeSortableId,
  markerSortableId,
  sortableIndexLookup,
}: {
  items: CrateLayoutItem[];
  activeSortableId: string;
  markerSortableId: string;
  sortableIndexLookup?: CrateLayoutSortableIndexLookup;
}): CrateLayoutItem[] => {
  const markerId = markerSortableId.replace(/^marker:/, "");
  const lookup =
    sortableIndexLookup ?? getCrateLayoutSortableIndexLookup(items);
  const oldIndex = getCrateLayoutSortableIndex({
    items,
    sortableId: activeSortableId,
    lookup,
  });
  const markerIndex = lookup.indexByMarkerId.get(markerId) ?? -1;

  if (oldIndex < 0 || markerIndex < 0) {
    return items;
  }

  const insertBefore = resolveCrateLayoutReleaseOverMarkerInsertBefore({
    items,
    activeSortableId,
    markerId,
    sortableIndexLookup: lookup,
  });

  if (insertBefore === null) {
    return items;
  }

  let insertIndex = insertBefore ? markerIndex : markerIndex + 1;

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(oldIndex, 1);

  if (!movedItem) {
    return items;
  }

  if (oldIndex < insertIndex) {
    insertIndex -= 1;
  }

  nextItems.splice(insertIndex, 0, movedItem);

  return nextItems;
};

export const reorderCrateLayoutReleaseOverSectionMemberEnd = ({
  items,
  activeSortableId,
  markerId,
  sortableIndexLookup,
}: {
  items: CrateLayoutItem[];
  activeSortableId: string;
  markerId: string;
  sortableIndexLookup?: CrateLayoutSortableIndexLookup;
}): CrateLayoutItem[] => {
  const lookup =
    sortableIndexLookup ?? getCrateLayoutSortableIndexLookup(items);
  const oldIndex = getCrateLayoutSortableIndex({
    items,
    sortableId: activeSortableId,
    lookup,
  });
  const markerIndex = lookup.indexByMarkerId.get(markerId) ?? -1;

  if (oldIndex < 0 || markerIndex < 0) {
    return items;
  }

  const block = getCrateLayoutSectionBlock({
    items,
    markerId,
    markerIndex,
  });
  let insertIndex = getCrateLayoutInsertIndexAfterSectionBlock({
    items,
    blockStart: markerIndex,
    block,
    sectionMarkerId: markerId,
  });

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(oldIndex, 1);

  if (!movedItem) {
    return items;
  }

  if (oldIndex < insertIndex) {
    insertIndex -= 1;
  }

  nextItems.splice(insertIndex, 0, movedItem);

  return nextItems;
};

export const reorderCrateLayoutVisibleSortableItems = ({
  visibleItems,
  activeSortableId,
  overSortableId,
  insertBeforeOver = true,
}: {
  visibleItems: CrateLayoutItem[];
  activeSortableId: string;
  overSortableId: string;
  insertBeforeOver?: boolean;
}): CrateLayoutItem[] => {
  if (activeSortableId === overSortableId) {
    return visibleItems;
  }

  const listInsertIndex =
    getCrateLayoutListInsertIndexFromDropId(overSortableId);

  if (activeSortableId.startsWith("release:") && listInsertIndex !== null) {
    return reorderCrateLayoutReleaseToVisibleInsertIndex({
      items: visibleItems,
      activeSortableId,
      insertIndex: listInsertIndex,
    });
  }

  const normalizedOverSortableId =
    normalizeCrateLayoutDragOverSortableId(overSortableId);

  const memberEndMarkerId =
    getCrateLayoutMarkerIdFromSectionMemberEndDropId(overSortableId);

  if (activeSortableId.startsWith("release:") && memberEndMarkerId) {
    return reorderCrateLayoutReleaseOverSectionMemberEnd({
      items: visibleItems,
      activeSortableId,
      markerId: memberEndMarkerId,
    });
  }

  if (activeSortableId.startsWith("marker:")) {
    const blockMap = getCrateLayoutSectionBlockSortableIdsByMarkerId(
      visibleItems,
      createCrateLayoutRenderBuildContext(visibleItems),
    );

    return moveCrateLayoutSectionBeforeSortableId({
      items: visibleItems,
      activeMarkerId: activeSortableId.replace(/^marker:/, ""),
      overSortableId: normalizedOverSortableId,
      sectionBlockSortableIdsByMarkerId: blockMap,
      insertBeforeOver,
    });
  }

  if (
    activeSortableId.startsWith("release:") &&
    normalizedOverSortableId.startsWith("marker:")
  ) {
    return reorderCrateLayoutReleaseOverSectionMarker({
      items: visibleItems,
      activeSortableId,
      markerSortableId: normalizedOverSortableId,
    });
  }

  return reorderCrateLayoutItems({
    items: visibleItems,
    activeId: activeSortableId,
    overId: normalizedOverSortableId,
    insertBeforeOver,
  });
};

export const resolveCrateLayoutDropIndicatorForDrag = ({
  items,
  activeSortableId,
  overSortableId,
  overRect,
  sortableIndexLookup,
  sectionBlockSortableIdsByMarkerId,
  pointerY,
}: {
  items: CrateLayoutItem[];
  activeSortableId: string;
  overSortableId: string;
  overRect: { top: number; left: number; width: number; height: number };
  sortableIndexLookup?: CrateLayoutSortableIndexLookup;
  sectionBlockSortableIdsByMarkerId?: ReadonlyMap<string, ReadonlySet<string>>;
  pointerY?: number | null;
}): { top: number; left: number; width: number } | null => {
  const lookup =
    sortableIndexLookup ?? getCrateLayoutSortableIndexLookup(items);

  if (
    activeSortableId.startsWith("release:") &&
    getCrateLayoutMarkerIdFromSectionEmptyDropId(overSortableId)
  ) {
    return null;
  }

  if (
    activeSortableId.startsWith("release:") &&
    getCrateLayoutMarkerIdFromSectionMemberEndDropId(overSortableId)
  ) {
    return null;
  }

  const listInsertIndex =
    getCrateLayoutListInsertIndexFromDropId(overSortableId);

  if (activeSortableId.startsWith("release:") && listInsertIndex !== null) {
    return {
      top: overRect.top,
      left: overRect.left,
      width: overRect.width,
    };
  }

  if (
    activeSortableId.startsWith("release:") &&
    overSortableId.startsWith("marker:")
  ) {
    const markerId = overSortableId.replace(/^marker:/, "");
    const insertBefore = resolveCrateLayoutReleaseOverMarkerInsertBefore({
      items,
      activeSortableId,
      markerId,
      sortableIndexLookup: lookup,
      ...(sectionBlockSortableIdsByMarkerId
        ? { sectionBlockSortableIdsByMarkerId }
        : {}),
    });

    if (insertBefore === null) {
      return null;
    }

    return {
      top: insertBefore ? overRect.top : overRect.top + overRect.height,
      left: overRect.left,
      width: overRect.width,
    };
  }

  return resolveCrateLayoutDropIndicator({
    items,
    activeSortableId,
    overSortableId,
    overRect,
    sortableIndexLookup: lookup,
    ...(pointerY !== undefined ? { pointerY } : {}),
  });
};

export const resolveCrateLayoutSectionIds = (
  items: CrateLayoutItem[],
): Array<{ instance_id: string; section_id: string | null }> => {
  const markersById = getCrateLayoutMarkerMap(items);
  const resolved: Array<{ instance_id: string; section_id: string | null }> =
    [];

  for (const [index, item] of items.entries()) {
    if (item.kind === "marker") {
      continue;
    }

    resolved.push({
      instance_id: item.instance_id,
      section_id: resolveValidatedReleaseSectionId(
        items,
        index,
        item.section_id,
        markersById,
      ),
    });
  }

  return resolved;
};

export const validateCrateLayoutSectionStructure = (
  items: CrateLayoutItem[],
): { ok: true } | { ok: false; error: string } => {
  const markersById = getCrateLayoutMarkerMap(items);
  const markerOrder = items.filter(
    (item): item is CrateLayoutMarkerItem => item.kind === "marker",
  );

  for (const layoutMarker of markerOrder) {
    if (layoutMarker.parent_id && !markersById.has(layoutMarker.parent_id)) {
      return {
        ok: false,
        error: "Section parent was not found in this layout",
      };
    }

    const depth = getCrateLayoutSectionDepth(layoutMarker.id, markersById);

    if (depth >= CRATE_SECTION_MAX_DEPTH) {
      return {
        ok: false,
        error: `Sections may nest at most ${CRATE_SECTION_MAX_DEPTH - 1} level deep`,
      };
    }

    if (layoutMarker.parent_id) {
      const parentIndex = items.findIndex(
        (item) => item.kind === "marker" && item.id === layoutMarker.parent_id,
      );
      const selfIndex = items.findIndex(
        (item) => item.kind === "marker" && item.id === layoutMarker.id,
      );

      if (parentIndex < 0 || selfIndex < 0 || parentIndex > selfIndex) {
        return {
          ok: false,
          error: "Section nesting must follow layout order",
        };
      }
    }
  }

  for (const item of items) {
    if (item.kind !== "release" || !item.section_id) {
      continue;
    }

    if (!markersById.has(item.section_id)) {
      return {
        ok: false,
        error: "Release section was not found in this layout",
      };
    }
  }

  return { ok: true };
};

export const reparentCrateLayoutMarkersAfterDelete = ({
  items,
  deletedMarkerId,
}: {
  items: CrateLayoutItem[];
  deletedMarkerId: string;
}): CrateLayoutItem[] => {
  const deletedMarker = items.find(
    (item): item is CrateLayoutMarkerItem =>
      item.kind === "marker" && item.id === deletedMarkerId,
  );
  const deletedIndex = items.findIndex(
    (item) => item.kind === "marker" && item.id === deletedMarkerId,
  );
  const fallbackParentId = deletedMarker?.parent_id ?? null;

  let precedingMarkerId: string | null = null;

  if (deletedIndex > 0) {
    for (let index = deletedIndex - 1; index >= 0; index -= 1) {
      const item = items[index];

      if (item?.kind === "marker") {
        precedingMarkerId = item.id;
        break;
      }
    }
  }

  return items
    .filter((item) => !(item.kind === "marker" && item.id === deletedMarkerId))
    .map((item) => {
      if (item.kind === "marker" && item.parent_id === deletedMarkerId) {
        return { ...item, parent_id: fallbackParentId };
      }

      if (item.kind === "release" && item.section_id === deletedMarkerId) {
        return {
          ...item,
          section_id: fallbackParentId ?? precedingMarkerId,
        };
      }

      return item;
    });
};

export const crateSectionAccentCssVar = (
  accentKey: string | null | undefined,
): string | undefined => {
  if (!accentKey) {
    return undefined;
  }

  return `var(--crate-section-accent-${accentKey})`;
};
