"use client";

import {
  type CollisionDetection,
  closestCenter,
  DndContext,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import classNames from "classnames";
import {
  type CSSProperties,
  type ElementType,
  Fragment,
  forwardRef,
  memo,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ConfirmDialog } from "src/components/ConfirmDialog/ConfirmDialog.component";
import {
  CrateLayoutReleaseRowContent,
  crateLayoutReleaseRowClassName,
} from "src/components/Crates/CrateLayoutReleaseRowContent.component";
import { EmptyState } from "src/components/EmptyState/EmptyState.component";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { ReleaseNotes } from "src/components/ReleaseNotes/ReleaseNotes.component";
import { ReleaseNotesCollectionFieldsProvider } from "src/components/ReleaseNotes/ReleaseNotesCollectionFields.context";
import { CRATE_TEMP_MARKER_PREFIX } from "src/constants/crate";
import {
  CRATE_SECTION_MAX_DEPTH,
  type CrateSectionAccentKey,
} from "src/constants/crateSectionAccent";
import { useCrateActions, useCrateState } from "src/context/crate.context";
import { useReleaseCardOpenHandler } from "src/hooks/useReleaseCardOpenHandler.hook";
import {
  assignSequentialCrateLayoutSortOrders,
  crateLayoutItemsToPutRequest,
  getCrateLayoutDragPointerY,
  getCrateLayoutListInsertDropId,
  getCrateLayoutListInsertIndexFromDropId,
  getCrateLayoutReleaseInstanceIdFromSortableId,
  getCrateLayoutReleaseItems,
  getCrateLayoutSortableId,
  getCrateLayoutSortableIndex,
  getVisibleCrateLayoutItems,
  insertCrateLayoutMarkerBeforeVisibleIndex,
  isCrateLayoutReleaseSortableId,
  resolveCrateLayoutInsertBeforeOverFromPointer,
} from "src/lib/crate-layout";
import {
  applyCrateLayoutListDragReorder,
  applyResolvedCrateLayoutSectionIds,
  buildVisibleCrateLayoutRenderBundle,
  type CrateLayoutMarkerMap,
  type CrateLayoutRenderSegment,
  type CrateLayoutSectionSegment,
  crateSectionAccentCssVar,
  filterCrateLayoutMarkerDragCollisions,
  getCrateLayoutInsertIndexAtSectionBodyTail,
  getCrateLayoutRenderSegmentKey,
  getCrateLayoutSectionDepth,
  getCrateLayoutSectionEmptyDropId,
  getCrateLayoutSectionMemberEndDropId,
  insertCrateLayoutSubsectionMarker,
  isCrateLayoutSectionReleaseDropZoneId,
  reparentCrateLayoutMarkersAfterDelete,
  resolveCrateLayoutDropIndicatorForDrag,
  resolveCrateLayoutForcedSectionIdForReleaseDrop,
  shouldShowCrateLayoutInsertZoneAtSectionBodyTail,
  shouldShowCrateLayoutSectionMemberEndDropZone,
} from "src/lib/crate-section-layout";
import GripVerticalIcon from "src/styles/icons/grip-vertical-thin.svg";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import type {
  CrateLayoutItem,
  CrateLayoutMarkerItem,
  CrateLayoutReleaseItem,
} from "src/types/crate.types";
import { definedProps } from "src/utils/definedProps";
import styles from "./CrateLayoutList.module.css";
import headInsertStyles from "./CrateLayoutListHeadInsert.module.css";
import { CrateReleaseActions } from "./CrateReleaseActions.component";
import listStyles from "./CrateReleaseList.module.css";
import { CrateSetMarkerRow } from "./CrateSetMarkerRow.component";

const CRATE_LAYOUT_LIST_INSERT_DROP_MIN_HEIGHT = "3.5rem";

const createCrateLayoutCollisionDetection = (
  sectionBlockSortableIdsByMarkerId: ReadonlyMap<string, ReadonlySet<string>>,
  layoutItems: CrateLayoutItem[],
  sortableIndexLookup: ReturnType<
    typeof buildVisibleCrateLayoutRenderBundle
  >["sortableIndexLookup"],
  enableTopListInsertDropTarget: boolean,
): CollisionDetection => {
  return (args) => {
    const activeId = String(args.active.id);

    if (isCrateLayoutReleaseSortableId(activeId)) {
      const sectionDropHits = pointerWithin(args).filter((collision) =>
        isCrateLayoutSectionReleaseDropZoneId(String(collision.id)),
      );

      if (sectionDropHits.length > 0) {
        return sectionDropHits;
      }

      const activeIndex = getCrateLayoutSortableIndex({
        items: layoutItems,
        sortableId: activeId,
        lookup: sortableIndexLookup,
      });

      if (enableTopListInsertDropTarget) {
        const listInsertHits = pointerWithin(args).filter((collision) => {
          const insertIndex = getCrateLayoutListInsertIndexFromDropId(
            String(collision.id),
          );

          if (insertIndex === null || activeIndex < 0) {
            return false;
          }

          if (insertIndex === activeIndex || insertIndex === activeIndex + 1) {
            return false;
          }

          return true;
        });

        const hasTopListInsertHit = listInsertHits.some(
          (collision) =>
            getCrateLayoutListInsertIndexFromDropId(String(collision.id)) === 0,
        );
        const hasBottomListInsertHit = listInsertHits.some(
          (collision) =>
            getCrateLayoutListInsertIndexFromDropId(String(collision.id)) ===
            layoutItems.length,
        );

        if (hasTopListInsertHit && activeIndex > 0) {
          return listInsertHits;
        }

        if (hasBottomListInsertHit && activeIndex < layoutItems.length - 1) {
          return listInsertHits;
        }

        const pointerSortableHits = pointerWithin(args).filter((collision) => {
          const id = String(collision.id);

          return isCrateLayoutReleaseSortableId(id) || id.startsWith("marker:");
        });

        if (pointerSortableHits.length > 0) {
          return closestCenter(args);
        }

        if (listInsertHits.length > 0) {
          return listInsertHits;
        }

        return closestCenter(args);
      }

      const pointerSortableHits = pointerWithin(args).filter((collision) => {
        const id = String(collision.id);

        return isCrateLayoutReleaseSortableId(id) || id.startsWith("marker:");
      });

      if (pointerSortableHits.length > 0) {
        return closestCenter(args);
      }

      return closestCenter(args);
    }

    if (!activeId.startsWith("marker:")) {
      return closestCenter(args);
    }

    const activeMarkerId = activeId.replace(/^marker:/, "");
    const filterCollisions = <T extends { id: string | number }>(
      collisions: readonly T[],
    ) =>
      filterCrateLayoutMarkerDragCollisions(collisions, {
        activeMarkerId,
        sectionBlockSortableIdsByMarkerId,
        items: layoutItems,
        sortableIndexLookup,
      });

    const closest = filterCollisions(closestCenter(args));

    if (closest.length > 0) {
      return closest;
    }

    return filterCollisions(pointerWithin(args));
  };
};

type CrateLayoutInsertZoneVariant = "inline" | "edgeTop" | "edgeBottom";

interface CrateLayoutInsertZoneProps {
  insertIndex: number;
  disabled: boolean;
  onInsert: (insertIndex: number) => void;
  isDraggingRelease?: boolean;
  as?: ElementType;
  variant?: CrateLayoutInsertZoneVariant;
  className?: string;
  testId?: string;
  registerAsDropTarget?: boolean;
  showAddButton?: boolean;
  dropLabel?: string;
  style?: CSSProperties;
}

const CrateLayoutInsertZone = forwardRef<
  HTMLElement,
  CrateLayoutInsertZoneProps
>(function CrateLayoutInsertZone(
  {
    insertIndex,
    disabled,
    onInsert,
    isDraggingRelease = false,
    as: Tag = "li",
    variant = "inline",
    className,
    testId,
    registerAsDropTarget = true,
    showAddButton = true,
    dropLabel,
    style,
  },
  ref,
) {
  const droppableId = getCrateLayoutListInsertDropId(insertIndex);
  const dropTargetActive = registerAsDropTarget && isDraggingRelease;
  const { setNodeRef } = useDroppable({
    id: droppableId,
    disabled: !dropTargetActive,
  });
  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      setNodeRef(node);

      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref, setNodeRef],
  );

  return (
    <Tag
      ref={setRefs}
      style={style}
      className={classNames(styles.insertZone, className, {
        [styles.insertZoneEdgeTop]: variant === "edgeTop",
        [styles.insertZoneEdgeBottom]: variant === "edgeBottom",
      })}
      data-testid={testId ?? `fmdCrateLayoutInsertDrop-${insertIndex}`}
    >
      <div
        className={classNames(styles.insertZoneHitArea, {
          [headInsertStyles.listHeadInsertHitArea]: !showAddButton,
        })}
      >
        {showAddButton ? (
          <IconButton
            variant="plus"
            className={styles.insertButton}
            iconClassName={styles.insertButtonIcon}
            disabled={disabled}
            aria-label="Add section (splits the list here)"
            onClick={() => onInsert(insertIndex)}
          >
            <PlusIcon />
          </IconButton>
        ) : dropLabel ? (
          <span className={headInsertStyles.listHeadInsertDropLabel}>
            {dropLabel}
          </span>
        ) : null}
      </div>
    </Tag>
  );
});

interface CrateLayoutListProps {
  crateId: string;
  layoutItems: CrateLayoutItem[];
  hidePackedItems: boolean;
  packedEnabled: boolean;
  isPacked: (instanceId: string) => boolean;
  setPacked: (instanceId: string, packed: boolean) => void;
  removeFromCrate: (instanceId: string) => void;
  onReleaseClick: (instanceId: string) => void;
  topInsertMount?: HTMLElement | null;
  bottomInsertMount?: HTMLElement | null;
}

interface SortableReleaseRowProps {
  item: CrateLayoutReleaseItem;
  packedEnabled: boolean;
  packed: boolean;
  setPacked: (instanceId: string, packed: boolean) => void;
  onRequestRemoveFromCrate: (instanceId: string, title: string) => void;
  onReleaseClick: (instanceId: string) => void;
}

const CrateLayoutReleaseDragPreview = ({
  item,
  packedEnabled,
  packed,
}: {
  item: CrateLayoutReleaseItem;
  packedEnabled: boolean;
  packed: boolean;
}) => (
  <li
    className={crateLayoutReleaseRowClassName({
      packedEnabled,
      packed,
      overlayPreview: true,
    })}
  >
    <CrateLayoutReleaseRowContent
      item={item}
      overlayPreview={true}
      dragHandle={
        <IconButton
          variant="skip"
          className={classNames(styles.dragHandle, styles.releaseRowHandle)}
          iconClassName={styles.dragHandleIcon}
          aria-hidden={true}
          tabIndex={-1}
        >
          <GripVerticalIcon />
        </IconButton>
      }
    />
  </li>
);

const SortableReleaseRow = memo(function SortableReleaseRow({
  item,
  packedEnabled,
  packed,
  setPacked,
  onRequestRemoveFromCrate,
  onReleaseClick,
}: SortableReleaseRowProps) {
  const release = item.release;
  const { basic_information } = release;
  const instanceId = String(release.instance_id);
  const sortableId = getCrateLayoutSortableId(item);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

  const { openRelease, prefetchReleaseOpen, prefetchPointerProps, canOpen } =
    useReleaseCardOpenHandler({
      release,
      onReleaseClick,
    });
  const releaseOpenFocusProps = definedProps(
    canOpen ? { onFocus: prefetchReleaseOpen } : {},
  );
  const handlePackedChange = useCallback(
    (nextPacked: boolean) => setPacked(instanceId, nextPacked),
    [instanceId, setPacked],
  );
  const handleRemove = useCallback(
    () => onRequestRemoveFromCrate(instanceId, basic_information.title),
    [basic_information.title, instanceId, onRequestRemoveFromCrate],
  );

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={crateLayoutReleaseRowClassName({
        packedEnabled,
        packed,
        isDragging,
      })}
      {...definedProps(prefetchPointerProps ?? {})}
    >
      <CrateLayoutReleaseRowContent
        item={item}
        identityActions={{
          openRelease,
          releaseOpenFocusProps,
        }}
        dragHandle={
          <IconButton
            variant="skip"
            className={classNames(styles.dragHandle, styles.releaseRowHandle)}
            iconClassName={styles.dragHandleIcon}
            aria-label="Reorder"
            {...attributes}
            {...listeners}
          >
            <GripVerticalIcon />
          </IconButton>
        }
        noteSlot={<ReleaseNotes release={release} variant="crate" />}
        actions={
          <CrateReleaseActions
            packedEnabled={packedEnabled}
            packed={packed}
            releaseTitle={basic_information.title}
            onPackedChange={handlePackedChange}
            onRemove={handleRemove}
          />
        }
      />
    </li>
  );
});

interface SortableMarkerRowProps {
  marker: CrateLayoutMarkerItem;
  autoFocus?: boolean;
  onLabelChange: (markerId: string, label: string) => void;
  onDelete: (markerId: string) => void;
  onAccentChange: (
    markerId: string,
    accentKey: CrateSectionAccentKey | null,
  ) => void;
  onAddSubsection: (markerId: string) => void;
  canAddSubsection: boolean;
  embeddedInSection?: boolean;
  headClassName?: string;
}

const SortableMarkerRow = memo(function SortableMarkerRow({
  marker,
  autoFocus = false,
  onLabelChange,
  onDelete,
  onAccentChange,
  onAddSubsection,
  canAddSubsection,
  embeddedInSection = false,
  headClassName,
}: SortableMarkerRowProps) {
  const markerId = marker.id;
  const sortableId = getCrateLayoutSortableId(marker);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });
  const handleLabelChange = useCallback(
    (label: string) => onLabelChange(markerId, label),
    [markerId, onLabelChange],
  );
  const handleDelete = useCallback(
    () => onDelete(markerId),
    [markerId, onDelete],
  );
  const handleAccentChange = useCallback(
    (accentKey: CrateSectionAccentKey | null) =>
      onAccentChange(markerId, accentKey),
    [markerId, onAccentChange],
  );
  const handleAddSubsection = useCallback(
    () => onAddSubsection(markerId),
    [markerId, onAddSubsection],
  );

  return (
    <CrateSetMarkerRow
      marker={marker}
      as={embeddedInSection ? "div" : "li"}
      className={classNames(styles.layoutMarkerRow, headClassName, {
        [styles.layoutMarkerRowDragging]: isDragging,
      })}
      fullWidth={true}
      autoFocus={autoFocus}
      dragHandleAttributes={attributes}
      {...definedProps({ dragHandleListeners: listeners })}
      setNodeRef={setNodeRef}
      isDragging={isDragging}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        width: "100%",
      }}
      onLabelChange={handleLabelChange}
      onDelete={handleDelete}
      onAccentChange={handleAccentChange}
      onAddSubsection={handleAddSubsection}
      canAddSubsection={canAddSubsection}
    />
  );
});

interface CrateLayoutSectionGroupProps {
  segment: CrateLayoutSectionSegment;
  markerMap: CrateLayoutMarkerMap;
  focusMarkerId: string | null;
  isDraggingRelease: boolean;
  isDraggingSectionMarker: boolean;
  renderLayoutSegment: (segment: CrateLayoutRenderSegment) => ReactNode;
  onLabelChange: (markerId: string, label: string) => void;
  onDelete: (markerId: string) => void;
  onAccentChange: (
    markerId: string,
    accentKey: CrateSectionAccentKey | null,
  ) => void;
  onAddSubsection: (markerId: string) => void;
  insertIndexAfterMarker: number;
  isSavingLayout: boolean;
  onInsertSection: (insertIndex: number) => void;
  layoutItems: CrateLayoutItem[];
}

const CrateLayoutEmptySectionInsertZone = ({
  markerId,
  insertIndex,
  isDraggingRelease,
  disabled,
  onInsert,
}: {
  markerId: string;
  insertIndex: number;
  isDraggingRelease: boolean;
  disabled: boolean;
  onInsert: (insertIndex: number) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: getCrateLayoutSectionEmptyDropId(markerId),
    disabled: !isDraggingRelease,
  });

  if (isDraggingRelease) {
    return (
      <li
        ref={setNodeRef}
        className={classNames(styles.insertZoneEmptySection, {
          [styles.insertZoneEmptySectionDragging]: true,
          [styles.insertZoneEmptySectionActive]: isOver,
        })}
        data-testid="fmdCrateSectionEmptyDrop"
      >
        <span className={styles.insertZoneSectionDropLabel}>
          Drop release here
        </span>
      </li>
    );
  }

  return (
    <CrateLayoutInsertZone
      ref={setNodeRef}
      insertIndex={insertIndex}
      disabled={disabled}
      onInsert={onInsert}
      testId="fmdCrateSectionEmptyDrop"
      className={classNames(styles.insertZoneEmptySection, {
        [styles.insertZoneEmptySectionDragging]: isDraggingRelease,
        [styles.insertZoneEmptySectionActive]: isOver && isDraggingRelease,
      })}
    />
  );
};

const CrateLayoutSectionMemberEndDropZone = ({
  markerId,
  isDraggingRelease,
  isDraggingSectionMarker,
}: {
  markerId: string;
  isDraggingRelease: boolean;
  isDraggingSectionMarker: boolean;
}) => {
  const isDraggingForDrop = isDraggingRelease || isDraggingSectionMarker;
  const { setNodeRef, isOver } = useDroppable({
    id: getCrateLayoutSectionMemberEndDropId(markerId),
    disabled: !isDraggingForDrop,
  });

  return (
    <li
      ref={setNodeRef}
      className={classNames(
        styles.insertZoneEmptySection,
        styles.insertZoneSectionMemberEnd,
        {
          [styles.insertZoneEmptySectionDragging]: isDraggingForDrop,
          [styles.insertZoneEmptySectionActive]: isOver && isDraggingForDrop,
        },
      )}
      data-testid="fmdCrateSectionMemberEndDrop"
    >
      <span className={styles.insertZoneSectionDropLabel}>
        Drop release here
      </span>
    </li>
  );
};

const CrateLayoutSectionGroup = memo(function CrateLayoutSectionGroup({
  segment,
  markerMap,
  focusMarkerId,
  isDraggingRelease,
  isDraggingSectionMarker,
  renderLayoutSegment,
  onLabelChange,
  onDelete,
  onAccentChange,
  onAddSubsection,
  insertIndexAfterMarker,
  isSavingLayout,
  onInsertSection,
  layoutItems,
}: CrateLayoutSectionGroupProps) {
  const { marker, bodySegments } = segment;
  const accentStyleProps = definedProps(
    marker.accent_key
      ? {
          style: {
            "--crate-section-accent": crateSectionAccentCssVar(
              marker.accent_key,
            ),
          } as CSSProperties,
        }
      : {},
  );
  const hasNestedSubsection = bodySegments.some(
    (bodySegment) =>
      bodySegment.kind === "section" &&
      bodySegment.marker.parent_id === marker.id,
  );
  const canAddSubsection =
    !hasNestedSubsection &&
    getCrateLayoutSectionDepth(marker.id, markerMap) <
      CRATE_SECTION_MAX_DEPTH - 1;
  const isSectionEmpty = bodySegments.length === 0;
  const lastBodySegment = bodySegments[bodySegments.length - 1];
  const nestedShowsTailInsert =
    lastBodySegment?.kind === "section" && lastBodySegment.showInsertAfter;
  const showBodyTailInsert =
    shouldShowCrateLayoutInsertZoneAtSectionBodyTail(bodySegments) &&
    !nestedShowsTailInsert;
  const bodyTailInsertIndex = showBodyTailInsert
    ? getCrateLayoutInsertIndexAtSectionBodyTail(layoutItems, marker.id)
    : null;

  return (
    <li
      className={classNames(styles.sectionGroup, {
        [styles.sectionGroupNested]: Boolean(marker.parent_id),
      })}
      {...accentStyleProps}
      {...(marker.accent_key
        ? { "data-section-accent": marker.accent_key }
        : {})}
    >
      <SortableMarkerRow
        marker={marker}
        embeddedInSection={true}
        headClassName={styles.sectionHead}
        autoFocus={focusMarkerId === marker.id}
        onLabelChange={onLabelChange}
        onDelete={onDelete}
        onAccentChange={onAccentChange}
        onAddSubsection={onAddSubsection}
        canAddSubsection={canAddSubsection}
      />
      <ul
        className={styles.sectionBody}
        {...(isSectionEmpty ? { "data-section-empty": "" } : {})}
      >
        {isSectionEmpty ? (
          <CrateLayoutEmptySectionInsertZone
            markerId={marker.id}
            insertIndex={insertIndexAfterMarker}
            isDraggingRelease={isDraggingRelease}
            disabled={isSavingLayout}
            onInsert={onInsertSection}
          />
        ) : null}
        {bodySegments.map((bodySegment) => (
          <Fragment key={getCrateLayoutRenderSegmentKey(bodySegment)}>
            {renderLayoutSegment(bodySegment)}
          </Fragment>
        ))}
        {bodyTailInsertIndex !== null ? (
          <CrateLayoutInsertZone
            insertIndex={bodyTailInsertIndex}
            disabled={isSavingLayout}
            onInsert={onInsertSection}
            className={styles.insertZoneSectionBodyTail}
          />
        ) : null}
        {!segment.suppressMemberEndDrop &&
        shouldShowCrateLayoutSectionMemberEndDropZone(bodySegments) ? (
          <CrateLayoutSectionMemberEndDropZone
            markerId={marker.id}
            isDraggingRelease={isDraggingRelease}
            isDraggingSectionMarker={isDraggingSectionMarker}
          />
        ) : null}
      </ul>
    </li>
  );
});

const CrateLayoutListComponent = ({
  crateId,
  layoutItems,
  hidePackedItems,
  packedEnabled,
  isPacked,
  setPacked,
  removeFromCrate,
  onReleaseClick,
  topInsertMount,
  bottomInsertMount,
}: CrateLayoutListProps) => {
  "use memo";
  const { updateCrateLayout } = useCrateActions();
  const { isPendingCrate, isUpdatingCrateLayout } = useCrateState();
  const [localLayoutItems, setLocalLayoutItems] = useState(layoutItems);
  const [focusMarkerId, setFocusMarkerId] = useState<string | null>(null);
  const [pendingMarkerDelete, setPendingMarkerDelete] =
    useState<CrateLayoutMarkerItem | null>(null);
  const [pendingReleaseRemove, setPendingReleaseRemove] = useState<{
    instanceId: string;
    title: string;
  } | null>(null);
  const [activeDragSortableId, setActiveDragSortableId] = useState<
    string | null
  >(null);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localLayoutRef = useRef(localLayoutItems);
  const dropIndicatorRef = useRef<HTMLDivElement | null>(null);
  const dropIndicatorSnapshotRef = useRef<string | null>(null);
  const releaseRowHandlersRef = useRef({
    setPacked,
    onReleaseClick,
    requestRemoveFromCrate: (_instanceId: string, _title: string) => {},
  });

  const syncDropIndicator = useCallback(
    (next: { top: number; left: number; width: number } | null) => {
      const element = dropIndicatorRef.current;

      if (!element) {
        return;
      }

      if (!next) {
        element.hidden = true;
        dropIndicatorSnapshotRef.current = null;

        return;
      }

      const snapshot = `${next.top}|${next.left}|${next.width}`;

      if (dropIndicatorSnapshotRef.current === snapshot) {
        return;
      }

      dropIndicatorSnapshotRef.current = snapshot;
      element.hidden = false;
      element.style.top = `${next.top}px`;
      element.style.left = `${next.left}px`;
      element.style.width = `${next.width}px`;
    },
    [],
  );

  const stableSetPacked = useCallback((instanceId: string, packed: boolean) => {
    releaseRowHandlersRef.current.setPacked(instanceId, packed);
  }, []);

  const stableOnReleaseClick = useCallback((instanceId: string) => {
    releaseRowHandlersRef.current.onReleaseClick(instanceId);
  }, []);

  const stableRequestRemoveFromCrate = useCallback(
    (instanceId: string, title: string) => {
      releaseRowHandlersRef.current.requestRemoveFromCrate(instanceId, title);
    },
    [],
  );

  useEffect(() => {
    setLocalLayoutItems((current) => {
      const hasUnsavedTempMarker = current.some(
        (item) =>
          item.kind === "marker" &&
          item.id.startsWith(CRATE_TEMP_MARKER_PREFIX),
      );

      if (hasUnsavedTempMarker) {
        return current;
      }

      return layoutItems;
    });
  }, [layoutItems]);

  useEffect(() => {
    if (!focusMarkerId) {
      return;
    }

    const markerId = focusMarkerId;
    const timer = window.setTimeout(() => {
      setFocusMarkerId((current) => (current === markerId ? null : current));
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [focusMarkerId]);

  localLayoutRef.current = localLayoutItems;

  useEffect(
    () => () => {
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
      }
    },
    [],
  );

  const visibleLayoutItems = useMemo(
    () =>
      getVisibleCrateLayoutItems({
        items: localLayoutItems,
        hidePackedItems,
        isPacked,
        packedEnabled,
      }),
    [hidePackedItems, isPacked, localLayoutItems, packedEnabled],
  );

  const visibleLayoutRenderBundle = useMemo(
    () => buildVisibleCrateLayoutRenderBundle(visibleLayoutItems),
    [visibleLayoutItems],
  );
  const {
    markerMap,
    sortableIndexLookup: visibleSortableIndexLookup,
    sortableIds,
    layoutSegments,
    sectionBlockSortableIdsByMarkerId,
  } = visibleLayoutRenderBundle;

  const activeDragSortableIndex = useMemo(() => {
    if (!activeDragSortableId) {
      return -1;
    }

    return getCrateLayoutSortableIndex({
      items: visibleLayoutItems,
      sortableId: activeDragSortableId,
      lookup: visibleSortableIndexLookup,
    });
  }, [activeDragSortableId, visibleLayoutItems, visibleSortableIndexLookup]);

  const activeDragReleaseItem = useMemo(() => {
    const instanceId = activeDragSortableId
      ? getCrateLayoutReleaseInstanceIdFromSortableId(activeDragSortableId)
      : null;

    if (!instanceId) {
      return null;
    }

    const item = visibleLayoutItems.find(
      (layoutItem): layoutItem is CrateLayoutReleaseItem =>
        layoutItem.kind === "release" && layoutItem.instance_id === instanceId,
    );

    return item ?? null;
  }, [activeDragSortableId, visibleLayoutItems]);

  const isDraggingSectionMarker = Boolean(
    activeDragSortableId?.startsWith("marker:"),
  );

  const releaseCount = useMemo(
    () => getCrateLayoutReleaseItems(localLayoutItems).length,
    [localLayoutItems],
  );

  const requestRemoveFromCrate = useCallback(
    (instanceId: string, title: string) => {
      setPendingReleaseRemove({ instanceId, title });
    },
    [],
  );

  releaseRowHandlersRef.current = {
    setPacked,
    onReleaseClick,
    requestRemoveFromCrate,
  };

  const confirmReleaseRemove = useCallback(() => {
    if (!pendingReleaseRemove) {
      return;
    }

    removeFromCrate(pendingReleaseRemove.instanceId);
    setPendingReleaseRemove(null);
  }, [pendingReleaseRemove, removeFromCrate]);

  const persistLayout = useCallback(
    (
      nextLayoutItems: CrateLayoutItem[],
      options?: { movedInstanceId?: string; forcedSectionId?: string },
    ) => {
      const normalizedItems = applyResolvedCrateLayoutSectionIds(
        assignSequentialCrateLayoutSortOrders(nextLayoutItems),
        options,
      );
      setLocalLayoutItems(normalizedItems);

      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
      }

      saveDebounceRef.current = setTimeout(() => {
        saveDebounceRef.current = null;
        updateCrateLayout(crateId, {
          layout: {
            items: crateLayoutItemsToPutRequest(normalizedItems),
          },
          optimisticLayoutItems: normalizedItems,
        });
      }, 300);
    },
    [crateId, updateCrateLayout],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveDragSortableId(String(event.active.id));
      syncDropIndicator(null);
    },
    [syncDropIndicator],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over?.rect) {
        syncDropIndicator(null);

        return;
      }

      const pointerY = getCrateLayoutDragPointerY(event);

      const nextIndicator = resolveCrateLayoutDropIndicatorForDrag({
        items: visibleLayoutItems,
        activeSortableId: String(active.id),
        overSortableId: String(over.id),
        overRect: over.rect,
        sortableIndexLookup: visibleSortableIndexLookup,
        sectionBlockSortableIdsByMarkerId,
        pointerY,
      });

      syncDropIndicator(nextIndicator);
    },
    [
      sectionBlockSortableIdsByMarkerId,
      syncDropIndicator,
      visibleLayoutItems,
      visibleSortableIndexLookup,
    ],
  );

  const handleDragCancel = useCallback(
    (_event: DragCancelEvent) => {
      setActiveDragSortableId(null);
      syncDropIndicator(null);
    },
    [syncDropIndicator],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragSortableId(null);
      syncDropIndicator(null);

      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const currentFullItems = localLayoutRef.current;
      const currentVisibleItems = getVisibleCrateLayoutItems({
        items: currentFullItems,
        hidePackedItems,
        isPacked,
        packedEnabled,
      });
      const activeId = String(active.id);
      const overId = String(over.id);
      const insertBeforeOver = over.rect
        ? resolveCrateLayoutInsertBeforeOverFromPointer({
            overRect: over.rect,
            pointerY: getCrateLayoutDragPointerY(event),
          })
        : true;
      const movedInstanceId =
        getCrateLayoutReleaseInstanceIdFromSortableId(activeId) ?? undefined;
      const nextFullItems = applyCrateLayoutListDragReorder({
        fullItems: currentFullItems,
        visibleItems: currentVisibleItems,
        activeSortableId: activeId,
        overSortableId: overId,
        insertBeforeOver,
      });
      const forcedSectionId = isCrateLayoutReleaseSortableId(activeId)
        ? resolveCrateLayoutForcedSectionIdForReleaseDrop(overId)
        : undefined;

      persistLayout(
        nextFullItems,
        definedProps({
          movedInstanceId,
          ...(forcedSectionId ? { forcedSectionId } : {}),
        }),
      );
    },
    [
      hidePackedItems,
      isPacked,
      packedEnabled,
      persistLayout,
      syncDropIndicator,
    ],
  );

  const handleAddSectionAt = useCallback(
    (insertIndex: number) => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      const nextMarkerId = `${CRATE_TEMP_MARKER_PREFIX}${crypto.randomUUID()}`;
      const nextMarker: CrateLayoutMarkerItem = {
        kind: "marker",
        id: nextMarkerId,
        label: "New section",
        sort_order: 0,
        parent_id: null,
        accent_key: null,
      };
      const currentFullItems = localLayoutRef.current;
      const currentVisibleItems = getVisibleCrateLayoutItems({
        items: currentFullItems,
        hidePackedItems,
        isPacked,
        packedEnabled,
      });
      const nextItems = insertCrateLayoutMarkerBeforeVisibleIndex({
        fullItems: currentFullItems,
        visibleItems: currentVisibleItems,
        insertIndex,
        marker: nextMarker,
      });

      setFocusMarkerId(nextMarkerId);
      setLocalLayoutItems(nextItems);
    },
    [hidePackedItems, isPacked, packedEnabled],
  );

  const handleAddSubsection = useCallback((parentMarkerId: string) => {
    const nextMarkerId = `${CRATE_TEMP_MARKER_PREFIX}${crypto.randomUUID()}`;
    const nextMarker: CrateLayoutMarkerItem = {
      kind: "marker",
      id: nextMarkerId,
      label: "New group",
      sort_order: 0,
      parent_id: parentMarkerId,
      accent_key: null,
    };
    const nextItems = insertCrateLayoutSubsectionMarker({
      fullItems: localLayoutRef.current,
      parentMarkerId,
      marker: nextMarker,
    });

    setFocusMarkerId(nextMarkerId);
    setLocalLayoutItems(nextItems);
  }, []);

  const handleMarkerAccentChange = useCallback(
    (markerId: string, accentKey: CrateSectionAccentKey | null) => {
      const nextItems = localLayoutRef.current.map((item) =>
        item.kind === "marker" && item.id === markerId
          ? { ...item, accent_key: accentKey }
          : item,
      );
      persistLayout(nextItems);
    },
    [persistLayout],
  );

  const handleMarkerLabelChange = useCallback(
    (markerId: string, label: string) => {
      const currentItems = localLayoutRef.current;
      const existingMarker = currentItems.find(
        (item): item is CrateLayoutMarkerItem =>
          item.kind === "marker" && item.id === markerId,
      );

      if (
        existingMarker &&
        existingMarker.label === label &&
        !markerId.startsWith(CRATE_TEMP_MARKER_PREFIX)
      ) {
        return;
      }

      const nextItems = currentItems.map((item) =>
        item.kind === "marker" && item.id === markerId
          ? { ...item, label }
          : item,
      );
      persistLayout(nextItems);
    },
    [persistLayout],
  );

  const handleMarkerDelete = useCallback((markerId: string) => {
    const marker = localLayoutRef.current.find(
      (item): item is CrateLayoutMarkerItem =>
        item.kind === "marker" && item.id === markerId,
    );

    if (!marker) {
      return;
    }

    queueMicrotask(() => {
      setPendingMarkerDelete(marker);
    });
  }, []);

  const confirmMarkerDelete = useCallback(() => {
    if (!pendingMarkerDelete) {
      return;
    }

    const reparented = reparentCrateLayoutMarkersAfterDelete({
      items: localLayoutRef.current,
      deletedMarkerId: pendingMarkerDelete.id,
    });
    setPendingMarkerDelete(null);
    persistLayout(reparented);
  }, [pendingMarkerDelete, persistLayout]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const isSavingLayout = isUpdatingCrateLayout;
  const useEdgeInsertMounts = Boolean(topInsertMount && bottomInsertMount);
  const isDraggingReleaseForInsert = Boolean(activeDragReleaseItem);
  const enableListInsertDropTargets =
    isDraggingReleaseForInsert && useEdgeInsertMounts;
  const showListHeadInsertDropZone =
    useEdgeInsertMounts &&
    enableListInsertDropTargets &&
    activeDragSortableIndex > 0;
  const showListTailInsertDropZone =
    useEdgeInsertMounts &&
    enableListInsertDropTargets &&
    activeDragSortableIndex >= 0 &&
    activeDragSortableIndex < sortableIds.length - 1;

  const collisionDetection = useMemo(
    () =>
      createCrateLayoutCollisionDetection(
        sectionBlockSortableIdsByMarkerId,
        visibleLayoutItems,
        visibleSortableIndexLookup,
        enableListInsertDropTargets,
      ),
    [
      enableListInsertDropTargets,
      sectionBlockSortableIdsByMarkerId,
      visibleLayoutItems,
      visibleSortableIndexLookup,
    ],
  );

  const topInsertZone = (
    <CrateLayoutInsertZone
      as={useEdgeInsertMounts ? "div" : "li"}
      variant={useEdgeInsertMounts ? "edgeTop" : "inline"}
      insertIndex={0}
      disabled={isSavingLayout}
      isDraggingRelease={
        useEdgeInsertMounts ? false : enableListInsertDropTargets
      }
      registerAsDropTarget={!useEdgeInsertMounts}
      showAddButton={true}
      {...definedProps(
        useEdgeInsertMounts
          ? { testId: "fmdCrateLayoutToolbarInsertDrop-0" }
          : {},
      )}
      onInsert={handleAddSectionAt}
    />
  );

  const listHeadInsertDropZone = showListHeadInsertDropZone ? (
    <CrateLayoutInsertZone
      as="li"
      insertIndex={0}
      disabled={isSavingLayout}
      isDraggingRelease={true}
      registerAsDropTarget={true}
      showAddButton={false}
      dropLabel="Drop release here"
      className={headInsertStyles.listHeadInsertDrop}
      style={{ minHeight: CRATE_LAYOUT_LIST_INSERT_DROP_MIN_HEIGHT }}
      onInsert={handleAddSectionAt}
    />
  ) : null;

  const renderLayoutSegment = useCallback(
    function renderLayoutSegment(segment: CrateLayoutRenderSegment): ReactNode {
      if (segment.kind === "loose") {
        return (
          <>
            <SortableReleaseRow
              item={segment.item}
              packedEnabled={packedEnabled}
              packed={
                packedEnabled ? isPacked(segment.item.instance_id) : false
              }
              setPacked={stableSetPacked}
              onRequestRemoveFromCrate={stableRequestRemoveFromCrate}
              onReleaseClick={stableOnReleaseClick}
            />
            {segment.showInsertAfter ? (
              <CrateLayoutInsertZone
                insertIndex={segment.itemIndex + 1}
                disabled={isSavingLayout}
                onInsert={handleAddSectionAt}
              />
            ) : null}
          </>
        );
      }

      return (
        <>
          <CrateLayoutSectionGroup
            segment={segment}
            markerMap={markerMap}
            focusMarkerId={focusMarkerId}
            isDraggingRelease={Boolean(activeDragReleaseItem)}
            isDraggingSectionMarker={isDraggingSectionMarker}
            renderLayoutSegment={renderLayoutSegment}
            onLabelChange={handleMarkerLabelChange}
            onDelete={handleMarkerDelete}
            onAccentChange={handleMarkerAccentChange}
            onAddSubsection={handleAddSubsection}
            insertIndexAfterMarker={segment.startIndex + 1}
            isSavingLayout={isSavingLayout}
            onInsertSection={handleAddSectionAt}
            layoutItems={visibleLayoutItems}
          />
          {segment.showInsertAfter ? (
            <CrateLayoutInsertZone
              insertIndex={segment.insertAfterIndex}
              disabled={isSavingLayout}
              onInsert={handleAddSectionAt}
            />
          ) : null}
        </>
      );
    },
    [
      focusMarkerId,
      handleAddSectionAt,
      handleAddSubsection,
      handleMarkerAccentChange,
      handleMarkerDelete,
      handleMarkerLabelChange,
      activeDragReleaseItem,
      isDraggingSectionMarker,
      isPacked,
      isSavingLayout,
      markerMap,
      packedEnabled,
      stableOnReleaseClick,
      stableRequestRemoveFromCrate,
      stableSetPacked,
      visibleLayoutItems,
    ],
  );

  const bottomInsertZone = (
    <CrateLayoutInsertZone
      as={useEdgeInsertMounts ? "div" : "li"}
      variant={useEdgeInsertMounts ? "edgeBottom" : "inline"}
      insertIndex={visibleLayoutItems.length}
      disabled={isSavingLayout}
      isDraggingRelease={
        useEdgeInsertMounts ? false : enableListInsertDropTargets
      }
      registerAsDropTarget={!useEdgeInsertMounts}
      showAddButton={true}
      {...definedProps(
        useEdgeInsertMounts
          ? {
              testId: `fmdCrateLayoutToolbarInsertDrop-${visibleLayoutItems.length}`,
            }
          : {},
      )}
      onInsert={handleAddSectionAt}
    />
  );

  const listTailInsertDropZone = showListTailInsertDropZone ? (
    <CrateLayoutInsertZone
      as="li"
      insertIndex={visibleLayoutItems.length}
      disabled={isSavingLayout}
      isDraggingRelease={true}
      registerAsDropTarget={true}
      showAddButton={false}
      dropLabel="Drop release here"
      className={headInsertStyles.listHeadInsertDrop}
      style={{ minHeight: CRATE_LAYOUT_LIST_INSERT_DROP_MIN_HEIGHT }}
      onInsert={handleAddSectionAt}
    />
  ) : null;

  if (releaseCount === 0 && visibleLayoutItems.length === 0) {
    return (
      <EmptyState
        variant="panel"
        title="No releases in this crate yet."
        description="Add albums from your collection on the Releases page."
        className={listStyles.emptyState}
        testId="fmdCrateReleasesTable"
      />
    );
  }

  return (
    <>
      <ConfirmDialog
        isOpen={pendingReleaseRemove !== null}
        title="Remove from crate?"
        message={
          pendingReleaseRemove
            ? `Remove "${pendingReleaseRemove.title}" from this crate? It stays in your collection.`
            : ""
        }
        confirmLabel="Remove from crate"
        variant="danger"
        onConfirm={confirmReleaseRemove}
        onCancel={() => setPendingReleaseRemove(null)}
        isConfirming={isPendingCrate}
      />
      <ConfirmDialog
        isOpen={pendingMarkerDelete !== null}
        title="Remove section?"
        message={
          pendingMarkerDelete
            ? `Remove "${pendingMarkerDelete.label}" from this crate? Releases stay in the list; nested groups move up one level.`
            : ""
        }
        confirmLabel="Remove section"
        variant="danger"
        onConfirm={confirmMarkerDelete}
        onCancel={() => setPendingMarkerDelete(null)}
        isConfirming={isSavingLayout}
      />
      {typeof document !== "undefined"
        ? createPortal(
            <div
              ref={dropIndicatorRef}
              className={styles.layoutDropIndicator}
              hidden
              aria-hidden={true}
            />,
            document.body,
          )
        : null}
      <ReleaseNotesCollectionFieldsProvider>
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
        >
          {useEdgeInsertMounts && topInsertMount
            ? createPortal(topInsertZone, topInsertMount)
            : null}
          {useEdgeInsertMounts && bottomInsertMount
            ? createPortal(bottomInsertZone, bottomInsertMount)
            : null}
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            <ul
              className={classNames(
                listStyles.list,
                styles.layoutList,
                showListHeadInsertDropZone &&
                  headInsertStyles.layoutListWithHeadInsertDrop,
              )}
              {...(activeDragSortableId
                ? { "data-crate-layout-dragging": "" }
                : {})}
              data-testid="fmdCrateReleasesTable"
            >
              {useEdgeInsertMounts ? null : topInsertZone}
              {listHeadInsertDropZone}
              {layoutSegments.map((segment) => (
                <Fragment key={getCrateLayoutRenderSegmentKey(segment)}>
                  {renderLayoutSegment(segment)}
                </Fragment>
              ))}
              {listTailInsertDropZone}
              {useEdgeInsertMounts ? null : bottomInsertZone}
            </ul>
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {activeDragReleaseItem ? (
              <CrateLayoutReleaseDragPreview
                item={activeDragReleaseItem}
                packedEnabled={packedEnabled}
                packed={
                  packedEnabled
                    ? isPacked(activeDragReleaseItem.instance_id)
                    : false
                }
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </ReleaseNotesCollectionFieldsProvider>
    </>
  );
};

export const CrateLayoutList = memo(CrateLayoutListComponent);
