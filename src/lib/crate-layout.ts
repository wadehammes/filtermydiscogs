import {
  CRATE_LAYOUT_SORT_STEP,
  CRATE_TEMP_MARKER_PREFIX,
} from "src/constants/crate";
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
  }));

  const markerItems: CrateLayoutMarkerItem[] = markers.map((marker) => ({
    kind: "marker",
    id: marker.id,
    label: marker.label,
    sort_order: marker.sort_order,
  }));

  return [...releaseItems, ...markerItems].sort(
    (left, right) => left.sort_order - right.sort_order,
  );
};

export const reorderCrateLayoutItems = ({
  items,
  activeId,
  overId,
}: {
  items: CrateLayoutItem[];
  activeId: string;
  overId: string;
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

  nextItems.splice(newIndex, 0, movedItem);

  return nextItems;
};

export const crateLayoutItemsToPutRequest = (
  items: CrateLayoutItem[],
): CrateLayoutPutItem[] => {
  return items.map((item) => {
    if (item.kind === "release") {
      return {
        kind: "release" as const,
        instance_id: item.instance_id,
      };
    }

    if (item.id.startsWith(CRATE_TEMP_MARKER_PREFIX)) {
      return {
        kind: "marker" as const,
        label: item.label,
      };
    }

    return {
      kind: "marker" as const,
      id: item.id,
      label: item.label,
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
  })),
  markers: items
    .filter((item): item is CrateLayoutMarkerItem => item.kind === "marker")
    .map((item) => ({
      id: item.id,
      label: item.label,
      sort_order: item.sort_order,
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
  const reorderedQueue = [...reorderedVisibleItems];

  return fullItems.map((item) => {
    const itemId = getCrateLayoutSortableId(item);
    if (!visibleIds.has(itemId)) {
      return item;
    }

    const nextItem = reorderedQueue.shift();
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
