import { CRATE_LAYOUT_SORT_STEP } from "src/constants/crate";
import type {
  CrateLayoutItem,
  CrateLayoutMarkerItem,
  CrateLayoutPutItem,
  CrateLayoutReleaseItem,
  CrateReleaseItem,
  CrateSetMarker,
} from "src/types/crate.types";

export const getCrateLayoutSortableId = (item: CrateLayoutItem): string => {
  if (item.kind === "release") {
    return `release:${item.instance_id}`;
  }

  return `marker:${item.id}`;
};

export const isCrateLayoutReleaseSortableId = (sortableId: string): boolean =>
  sortableId.startsWith("release:");

export const getCrateLayoutReleaseInstanceIdFromSortableId = (
  sortableId: string,
): string | null => {
  if (!isCrateLayoutReleaseSortableId(sortableId)) {
    return null;
  }

  return sortableId.slice("release:".length);
};

export const CRATE_LAYOUT_LIST_INSERT_DROP_PREFIX = "layout-insert:";

export const getCrateLayoutListInsertDropId = (insertIndex: number): string =>
  `${CRATE_LAYOUT_LIST_INSERT_DROP_PREFIX}${insertIndex}`;

export const getCrateLayoutListInsertIndexFromDropId = (
  overSortableId: string,
): number | null => {
  if (!overSortableId.startsWith(CRATE_LAYOUT_LIST_INSERT_DROP_PREFIX)) {
    return null;
  }

  const parsed = Number.parseInt(
    overSortableId.slice(CRATE_LAYOUT_LIST_INSERT_DROP_PREFIX.length),
    10,
  );

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export const reorderCrateLayoutReleaseToVisibleInsertIndex = ({
  items,
  activeSortableId,
  insertIndex,
}: {
  items: CrateLayoutItem[];
  activeSortableId: string;
  insertIndex: number;
}): CrateLayoutItem[] => {
  if (!isCrateLayoutReleaseSortableId(activeSortableId)) {
    return items;
  }

  const oldIndex = getCrateLayoutSortableIndex({
    items,
    sortableId: activeSortableId,
  });

  if (oldIndex < 0) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(oldIndex, 1);

  if (!movedItem) {
    return items;
  }

  const clampedInsert = Math.max(0, Math.min(insertIndex, nextItems.length));
  nextItems.splice(clampedInsert, 0, movedItem);

  return nextItems;
};

export type CrateLayoutSortableIndexLookup = Readonly<{
  indexBySortableId: ReadonlyMap<string, number>;
  indexByMarkerId: ReadonlyMap<string, number>;
  indexByInstanceId: ReadonlyMap<string, number>;
  sortableIds: readonly string[];
}>;

export const getCrateLayoutSortableIndexLookup = (
  items: CrateLayoutItem[],
): CrateLayoutSortableIndexLookup => {
  const indexBySortableId = new Map<string, number>();
  const indexByMarkerId = new Map<string, number>();
  const indexByInstanceId = new Map<string, number>();
  const sortableIds: string[] = [];

  for (const [index, item] of items.entries()) {
    const sortableId = getCrateLayoutSortableId(item);
    sortableIds.push(sortableId);
    indexBySortableId.set(sortableId, index);

    if (item.kind === "marker") {
      indexByMarkerId.set(item.id, index);
    } else {
      indexByInstanceId.set(item.instance_id, index);
    }
  }

  return { indexBySortableId, indexByMarkerId, indexByInstanceId, sortableIds };
};

export const getCrateLayoutSortableIndex = ({
  items,
  sortableId,
  lookup,
}: {
  items: CrateLayoutItem[];
  sortableId: string;
  lookup?: CrateLayoutSortableIndexLookup;
}): number => {
  if (lookup) {
    return lookup.indexBySortableId.get(sortableId) ?? -1;
  }

  return items.findIndex(
    (item) => getCrateLayoutSortableId(item) === sortableId,
  );
};

export const buildCrateLayout = ({
  releases,
  markers,
}: {
  releases: CrateReleaseItem[];
  markers: CrateSetMarker[];
}): CrateLayoutItem[] => {
  const releaseItems: CrateLayoutReleaseItem[] = releases.map((item) => ({
    kind: "release",
    instance_id: String(item.release.instance_id),
    sort_order: item.sort_order,
    release: item.release,
    found_at: item.found_at,
    section_id: item.section_id ?? null,
  }));

  const markerItems: CrateLayoutMarkerItem[] = markers.map((marker) => ({
    kind: "marker",
    id: marker.id,
    label: marker.label,
    sort_order: marker.sort_order,
    parent_id: marker.parent_id ?? null,
    accent_key: marker.accent_key ?? null,
  }));

  return [...releaseItems, ...markerItems].sort(
    (left, right) => left.sort_order - right.sort_order,
  );
};

export const reorderCrateLayoutItems = ({
  items,
  activeId,
  overId,
  insertBeforeOver = true,
}: {
  items: CrateLayoutItem[];
  activeId: string;
  overId: string;
  insertBeforeOver?: boolean;
}): CrateLayoutItem[] => {
  if (activeId === overId) {
    return items;
  }

  const oldIndex = items.findIndex(
    (item) => getCrateLayoutSortableId(item) === activeId,
  );
  const newIndex = items.findIndex(
    (item) => getCrateLayoutSortableId(item) === overId,
  );

  if (oldIndex < 0 || newIndex < 0) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(oldIndex, 1);
  if (!movedItem) {
    return items;
  }

  const insertIndex = insertBeforeOver
    ? oldIndex < newIndex
      ? newIndex - 1
      : newIndex
    : oldIndex <= newIndex
      ? newIndex
      : newIndex + 1;

  nextItems.splice(insertIndex, 0, movedItem);

  return nextItems;
};

export const resolveCrateLayoutInsertBeforeOverFromPointer = ({
  overRect,
  pointerY,
}: {
  overRect: { top: number; height: number };
  pointerY?: number | null;
}): boolean => {
  if (pointerY == null || !Number.isFinite(pointerY)) {
    return true;
  }

  return pointerY < overRect.top + overRect.height / 2;
};

export const getCrateLayoutDragPointerY = (event: {
  activatorEvent: Event;
  delta: { y: number };
}): number | null => {
  const { activatorEvent, delta } = event;

  if (activatorEvent instanceof MouseEvent) {
    return activatorEvent.clientY + delta.y;
  }

  if (activatorEvent instanceof TouchEvent) {
    const touch = activatorEvent.touches[0] ?? activatorEvent.changedTouches[0];

    if (touch) {
      return touch.clientY + delta.y;
    }
  }

  if ("clientY" in activatorEvent) {
    const clientY = Number((activatorEvent as MouseEvent).clientY);

    if (Number.isFinite(clientY)) {
      return clientY + delta.y;
    }
  }

  return null;
};

export const resolveCrateLayoutDropIndicator = ({
  items,
  activeSortableId,
  overSortableId,
  overRect,
  sortableIndexLookup,
  pointerY,
}: {
  items: CrateLayoutItem[];
  activeSortableId: string;
  overSortableId: string;
  overRect: { top: number; left: number; width: number; height: number };
  sortableIndexLookup?: CrateLayoutSortableIndexLookup;
  pointerY?: number | null;
}): { top: number; left: number; width: number } | null => {
  if (activeSortableId === overSortableId) {
    return null;
  }

  const activeIndex = sortableIndexLookup
    ? getCrateLayoutSortableIndex({
        items,
        sortableId: activeSortableId,
        lookup: sortableIndexLookup,
      })
    : getCrateLayoutSortableIndex({ items, sortableId: activeSortableId });
  const overIndex = sortableIndexLookup
    ? getCrateLayoutSortableIndex({
        items,
        sortableId: overSortableId,
        lookup: sortableIndexLookup,
      })
    : getCrateLayoutSortableIndex({ items, sortableId: overSortableId });

  if (activeIndex < 0 || overIndex < 0) {
    return null;
  }

  const insertBeforeOver = resolveCrateLayoutInsertBeforeOverFromPointer({
    overRect,
    ...(pointerY !== undefined ? { pointerY } : {}),
  });
  const top = insertBeforeOver ? overRect.top : overRect.top + overRect.height;

  return {
    top,
    left: overRect.left,
    width: overRect.width,
  };
};

export const crateLayoutItemsToPutRequest = (
  items: CrateLayoutItem[],
): CrateLayoutPutItem[] => {
  return items.map((item) => {
    if (item.kind === "release") {
      return {
        kind: "release" as const,
        instance_id: item.instance_id,
        section_id: item.section_id,
      };
    }

    const markerFields = {
      parent_id: item.parent_id,
      accent_key: item.accent_key,
    };

    return {
      kind: "marker" as const,
      id: item.id,
      label: item.label,
      ...markerFields,
    };
  });
};

export const getCrateLayoutReleaseItems = (
  items: CrateLayoutItem[],
): CrateLayoutReleaseItem[] =>
  items.filter(
    (item): item is CrateLayoutReleaseItem => item.kind === "release",
  );

export const filterCrateLayoutForHiddenPacked = ({
  items,
  hidePackedItems,
  isPacked,
}: {
  items: CrateLayoutItem[];
  hidePackedItems: boolean;
  isPacked: (instanceId: string) => boolean;
}): CrateLayoutItem[] => {
  if (!hidePackedItems) {
    return items;
  }

  return items.filter((item) => {
    if (item.kind === "marker") {
      return true;
    }

    return !isPacked(item.instance_id);
  });
};

export const getVisibleCrateLayoutItems = ({
  items,
  hidePackedItems,
  isPacked,
  packedEnabled = true,
}: {
  items: CrateLayoutItem[];
  hidePackedItems: boolean;
  isPacked: (instanceId: string) => boolean;
  packedEnabled?: boolean;
}): CrateLayoutItem[] =>
  filterCrateLayoutForHiddenPacked({
    items,
    hidePackedItems: packedEnabled && hidePackedItems,
    isPacked,
  });

export const countVisibleCrateReleases = (
  params: Parameters<typeof getVisibleCrateLayoutItems>[0],
): number =>
  getCrateLayoutReleaseItems(getVisibleCrateLayoutItems(params)).length;

export const assignSequentialCrateLayoutSortOrders = (
  items: CrateLayoutItem[],
): CrateLayoutItem[] =>
  items.map((item, index) => ({
    ...item,
    sort_order: (index + 1) * CRATE_LAYOUT_SORT_STEP,
  }));

export const getPrependCrateLayoutSortOrder = (
  existingSortOrders: number[],
): number => {
  if (existingSortOrders.length === 0) {
    return CRATE_LAYOUT_SORT_STEP;
  }

  return Math.min(...existingSortOrders) - CRATE_LAYOUT_SORT_STEP;
};

export const splitCrateLayoutItemsForCache = (
  items: CrateLayoutItem[],
): {
  releases: CrateReleaseItem[];
  markers: CrateSetMarker[];
} => ({
  releases: getCrateLayoutReleaseItems(items).map((item) => ({
    release: item.release,
    found_at: item.found_at,
    sort_order: item.sort_order,
    section_id: item.section_id,
  })),
  markers: items
    .filter((item): item is CrateLayoutMarkerItem => item.kind === "marker")
    .map((item) => ({
      id: item.id,
      label: item.label,
      sort_order: item.sort_order,
      parent_id: item.parent_id,
      accent_key: item.accent_key,
    })),
});

export const mergeReorderedVisibleCrateLayout = ({
  fullItems,
  visibleItems,
  reorderedVisibleItems,
}: {
  fullItems: CrateLayoutItem[];
  visibleItems: CrateLayoutItem[];
  reorderedVisibleItems: CrateLayoutItem[];
}): CrateLayoutItem[] => {
  const visibleIds = new Set(
    visibleItems.map((item) => getCrateLayoutSortableId(item)),
  );
  let reorderedIndex = 0;

  return fullItems.map((item) => {
    const itemId = getCrateLayoutSortableId(item);
    if (!visibleIds.has(itemId)) {
      return item;
    }

    const nextItem = reorderedVisibleItems[reorderedIndex];
    reorderedIndex += 1;

    return nextItem ?? item;
  });
};

export const insertCrateLayoutMarkerBeforeVisibleIndex = ({
  fullItems,
  visibleItems,
  insertIndex,
  marker,
}: {
  fullItems: CrateLayoutItem[];
  visibleItems: CrateLayoutItem[];
  insertIndex: number;
  marker: CrateLayoutMarkerItem;
}): CrateLayoutItem[] => {
  if (visibleItems.length === 0) {
    return [...fullItems, marker];
  }

  if (insertIndex >= visibleItems.length) {
    const lastVisible = visibleItems[visibleItems.length - 1];
    if (!lastVisible) {
      return [...fullItems, marker];
    }

    const lastId = getCrateLayoutSortableId(lastVisible);
    const fullIndex = fullItems.findIndex(
      (item) => getCrateLayoutSortableId(item) === lastId,
    );

    if (fullIndex < 0) {
      return [...fullItems, marker];
    }

    const nextItems = [...fullItems];
    nextItems.splice(fullIndex + 1, 0, marker);
    return nextItems;
  }

  const beforeItem = visibleItems[insertIndex];
  if (!beforeItem) {
    return [...fullItems, marker];
  }

  const beforeId = getCrateLayoutSortableId(beforeItem);
  const fullIndex = fullItems.findIndex(
    (item) => getCrateLayoutSortableId(item) === beforeId,
  );

  if (fullIndex < 0) {
    return [...fullItems, marker];
  }

  const nextItems = [...fullItems];
  nextItems.splice(fullIndex, 0, marker);
  return nextItems;
};
