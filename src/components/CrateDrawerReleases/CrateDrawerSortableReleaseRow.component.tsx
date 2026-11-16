"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import classNames from "classnames";
import { CrateDrawerReleaseItem } from "src/components/CrateDrawerReleaseItem/CrateDrawerReleaseItem.component";
import type { DiscogsRelease } from "src/types";
import styles from "./CrateDrawerReleases.module.css";

export interface CrateDrawerSortableReleaseRowProps {
  release: DiscogsRelease;
  packed: boolean;
  onReleaseClick?: (instanceId: string) => void;
  onPackedChange: (packed: boolean) => void;
  onRemove: (releaseId: string) => void;
}

export const CrateDrawerSortableReleaseRow = ({
  release,
  packed,
  onReleaseClick,
  onPackedChange,
  onRemove,
}: CrateDrawerSortableReleaseRowProps) => {
  const sortableId = `release:${release.instance_id}`;
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableId,
    animateLayoutChanges: () => false,
  });

  return (
    <li
      ref={setNodeRef}
      className={classNames({ [styles.releaseRowDragging]: isDragging })}
      style={{
        transform: CSS.Translate.toString(transform),
        transition: isDragging ? transition : undefined,
      }}
    >
      <CrateDrawerReleaseItem
        release={release}
        packed={packed}
        onPackedChange={onPackedChange}
        onRemove={onRemove}
        {...(onReleaseClick ? { onReleaseClick } : {})}
        setDragHandleRef={setActivatorNodeRef}
        dragHandleAttributes={attributes}
        {...(listeners ? { dragHandleListeners: listeners } : {})}
        isDragging={isDragging}
      />
    </li>
  );
};
