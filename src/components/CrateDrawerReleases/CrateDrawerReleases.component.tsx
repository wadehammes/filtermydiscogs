"use client";

import { closestCenter, DndContext } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo } from "react";
import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import { CrateDrawerSortableReleaseRow } from "src/components/CrateDrawerReleases/CrateDrawerSortableReleaseRow.component";
import { useCrateDrawerReleasesDnD } from "src/components/CrateDrawerReleases/useCrateDrawerReleasesDnD.hook";
import { CrateReleaseListToolbar } from "src/components/CrateReleaseListToolbar/CrateReleaseListToolbar.component";
import { EmptyState } from "src/components/EmptyState/EmptyState.component";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import {
  countVisibleCrateReleases,
  getCrateLayoutReleaseItems,
} from "src/lib/crate-layout";
import drawerSortableListStyles from "src/styles/modules/drawer-sortable-list.module.css";
import { definedProps } from "src/utils/definedProps";
import styles from "./CrateDrawerReleases.module.css";

const crateDrawerReleaseDragModifiers = [restrictToVerticalAxis];

export const CrateDrawerReleases = () => {
  const {
    activeCrateId,
    hidePackedItems,
    isLoadingReleases,
    isPacked,
    layoutItems,
    onReleaseClick,
    packedEnabled,
    removeFromCrate,
    selectedReleases,
    setPacked,
    updateCrateLayout,
    currentView,
  } = useCrateDrawerContext();

  const stagingReleases = useMemo(
    () => getCrateLayoutReleaseItems(layoutItems),
    [layoutItems],
  );

  const { handleDragEnd, sensors, sortableIds, visibleLayoutReleases } =
    useCrateDrawerReleasesDnD({
      activeCrateId,
      hidePackedItems,
      isPacked,
      layoutItems,
      packedEnabled,
      updateCrateLayout,
    });

  if (isLoadingReleases) {
    return (
      <div className={styles.loadingState}>
        <PageLoader message="Loading crate..." />
      </div>
    );
  }

  if (stagingReleases.length === 0) {
    return (
      <EmptyState
        variant="panel"
        title="No releases added yet."
        description={
          currentView === "list"
            ? "Toggle the checkbox on any release to stage it in this crate."
            : 'Click "+ Add to Crate" on any release to stage it here.'
        }
        className={styles.emptyState}
      />
    );
  }

  const visibleReleaseCount = countVisibleCrateReleases({
    items: layoutItems,
    hidePackedItems,
    isPacked,
    packedEnabled,
  });
  const showAllPackedState =
    packedEnabled && visibleReleaseCount === 0 && selectedReleases.length > 0;
  const showPackingToolbar = packedEnabled;

  return (
    <div
      className={styles.releasesSection}
      data-testid="fmdCrateDrawerReleases"
    >
      {showPackingToolbar ? (
        <div className={styles.packingToolbarSticky}>
          <CrateReleaseListToolbar
            sticky={false}
            className={styles.packingToolbar}
          />
        </div>
      ) : null}
      {showAllPackedState ? (
        <EmptyState
          variant="panel"
          title="All albums packed for your gig."
          className={styles.emptyState}
        />
      ) : visibleLayoutReleases.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={crateDrawerReleaseDragModifiers}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            <ul className={drawerSortableListStyles.list}>
              {visibleLayoutReleases.map((item) => (
                <CrateDrawerSortableReleaseRow
                  key={item.instance_id}
                  release={item.release}
                  packed={packedEnabled ? isPacked(item.instance_id) : false}
                  onPackedChange={(packed) =>
                    setPacked(item.instance_id, packed)
                  }
                  onRemove={removeFromCrate}
                  {...definedProps({ onReleaseClick })}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : null}
    </div>
  );
};
