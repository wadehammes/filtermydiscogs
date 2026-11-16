import {
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useMemo } from "react";
import type { useCrate } from "src/context/crate.context";
import {
  crateLayoutItemsToPutRequest,
  getCrateLayoutReleaseItems,
  getCrateLayoutSortableId,
  getVisibleCrateLayoutItems,
  reorderCrateDrawerVisibleReleaseDrag,
} from "src/lib/crate-layout";
import type {
  CrateLayoutItem,
  CrateLayoutPutRequest,
} from "src/types/crate.types";

export const useCrateDrawerReleasesDnD = ({
  activeCrateId,
  hidePackedItems,
  isPacked,
  layoutItems,
  packedEnabled,
  updateCrateLayout,
}: {
  activeCrateId: string | null;
  hidePackedItems: boolean;
  isPacked: ReturnType<typeof useCrate>["isPacked"];
  layoutItems: CrateLayoutItem[];
  packedEnabled: boolean;
  updateCrateLayout: (
    crateId: string,
    update: {
      layout: CrateLayoutPutRequest;
      optimisticLayoutItems: CrateLayoutItem[];
    },
  ) => void;
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const visibleLayoutReleases = useMemo(() => {
    return getCrateLayoutReleaseItems(
      getVisibleCrateLayoutItems({
        items: layoutItems,
        hidePackedItems,
        isPacked,
        packedEnabled,
      }),
    );
  }, [hidePackedItems, isPacked, layoutItems, packedEnabled]);

  const sortableIds = useMemo(
    () => visibleLayoutReleases.map((item) => getCrateLayoutSortableId(item)),
    [visibleLayoutReleases],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!(over && activeCrateId) || active.id === over.id) {
        return;
      }

      const nextLayout = reorderCrateDrawerVisibleReleaseDrag({
        layoutItems,
        hidePackedItems,
        packedEnabled,
        isPacked,
        activeSortableId: String(active.id),
        overSortableId: String(over.id),
      });

      updateCrateLayout(activeCrateId, {
        layout: {
          items: crateLayoutItemsToPutRequest(nextLayout),
        },
        optimisticLayoutItems: nextLayout,
      });
    },
    [
      activeCrateId,
      hidePackedItems,
      isPacked,
      layoutItems,
      packedEnabled,
      updateCrateLayout,
    ],
  );

  return {
    handleDragEnd,
    sensors,
    sortableIds,
    visibleLayoutReleases,
  };
};
