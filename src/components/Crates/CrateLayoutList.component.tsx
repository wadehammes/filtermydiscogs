"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
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
import Image from "next/image";
import {
  type ElementType,
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { EmptyState } from "src/components/EmptyState/EmptyState.component";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { ReleaseCardMeta } from "src/components/ReleaseCard/ReleaseCardMeta.component";
import { ReleaseHeaderArtistLine } from "src/components/ReleaseCard/ReleaseHeaderLinks.component";
import { ReleaseNotes } from "src/components/ReleaseNotes/ReleaseNotes.component";
import { CRATE_TEMP_MARKER_PREFIX } from "src/constants/crate";
import { useCrateActions, useCrateState } from "src/context/crate.context";
import { useReleaseCardOpenHandler } from "src/hooks/useReleaseCardOpenHandler.hook";
import {
  assignSequentialCrateLayoutSortOrders,
  crateLayoutItemsToPutRequest,
  filterCrateLayoutForHiddenPacked,
  getCrateLayoutReleaseItems,
  getCrateLayoutSortableId,
  insertCrateLayoutMarkerBeforeVisibleIndex,
  mergeReorderedVisibleCrateLayout,
  reorderCrateLayoutItems,
} from "src/lib/crate-layout";
import GripVerticalIcon from "src/styles/icons/grip-vertical-thin.svg";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import type {
  CrateLayoutItem,
  CrateLayoutMarkerItem,
  CrateLayoutReleaseItem,
} from "src/types/crate.types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import styles from "./CrateLayoutList.module.css";
import { CrateReleaseActions } from "./CrateReleaseActions.component";
import listStyles from "./CrateReleaseList.module.css";
import { CrateSetMarkerRow } from "./CrateSetMarkerRow.component";

type CrateLayoutInsertZoneVariant = "inline" | "edgeTop" | "edgeBottom";

interface CrateLayoutInsertZoneProps {
  insertIndex: number;
  disabled: boolean;
  onInsert: (insertIndex: number) => void;
  as?: ElementType;
  variant?: CrateLayoutInsertZoneVariant;
  className?: string;
}

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
  removeFromCrate: (instanceId: string) => void;
  onReleaseClick: (instanceId: string) => void;
}

const SortableReleaseRow = ({
  item,
  packedEnabled,
  packed,
  setPacked,
  removeFromCrate,
  onReleaseClick,
}: SortableReleaseRowProps) => {
  const release = item.release;
  const { basic_information } = release;
  const instanceId = String(release.instance_id);
  const { artists, labels, title, year } = basic_information;
  const labelUrl = getResourceUrl({
    resourceUrl: labels[0]?.resource_url,
    type: "label",
  });
  const sortableId = getCrateLayoutSortableId(item);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

  const imageUrl = getReleaseImageUrl({
    thumb: basic_information.thumb,
    cover_image: basic_information.cover_image,
    width: 112,
    height: 112,
    preferCoverImage: true,
  });

  const { openRelease, prefetchReleaseOpen, prefetchPointerProps, canOpen } =
    useReleaseCardOpenHandler({
      release,
      onReleaseClick,
    });
  const releaseOpenFocusProps = definedProps(
    canOpen ? { onFocus: prefetchReleaseOpen } : {},
  );

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={classNames(
        listStyles.row,
        styles.layoutReleaseRow,
        styles.releaseRowWithHandle,
        {
          [styles.layoutReleaseRowPacked]: packedEnabled && packed,
          [styles.releaseRowDragging]: isDragging,
        },
      )}
      {...definedProps(prefetchPointerProps ?? {})}
    >
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
      <div className={listStyles.identity}>
        <button
          type="button"
          className={listStyles.identityCoverButton}
          onClick={openRelease}
          aria-label={`Open ${title}`}
          {...releaseOpenFocusProps}
        >
          <span className={listStyles.cover}>
            <Image
              src={imageUrl}
              alt=""
              width={56}
              height={56}
              sizes="(width >= 1024px) 56px, 48px"
            />
          </span>
        </button>
        <div className={listStyles.identityText}>
          <ReleaseHeaderArtistLine
            artists={artists}
            className={listStyles.identityArtist}
            linkClassName={listStyles.identityMetaLink}
          />
          <button
            type="button"
            className={listStyles.identityTitle}
            onClick={openRelease}
            {...releaseOpenFocusProps}
          >
            {title}
          </button>
          <ReleaseCardMeta
            labelName={labels[0]?.name}
            labelUrl={labelUrl}
            year={year}
            metaClassName={listStyles.identityMeta}
          />
        </div>
      </div>
      <div className={listStyles.noteSlot}>
        <ReleaseNotes release={release} variant="crate" />
      </div>
      <div className={listStyles.actions}>
        <CrateReleaseActions
          packedEnabled={packedEnabled}
          packed={packed}
          releaseTitle={basic_information.title}
          onPackedChange={(nextPacked) => setPacked(instanceId, nextPacked)}
          onRemove={() => removeFromCrate(instanceId)}
        />
      </div>
    </li>
  );
};

interface SortableMarkerRowProps {
  marker: CrateLayoutMarkerItem;
  autoFocus?: boolean;
  onLabelChange: (markerId: string, label: string) => void;
  onDelete: (markerId: string) => void;
}

const SortableMarkerRow = ({
  marker,
  autoFocus = false,
  onLabelChange,
  onDelete,
}: SortableMarkerRowProps) => {
  const sortableId = getCrateLayoutSortableId(marker);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

  return (
    <CrateSetMarkerRow
      marker={marker}
      className={styles.layoutMarkerRow}
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
      onLabelChange={(label) => onLabelChange(marker.id, label)}
      onDelete={() => onDelete(marker.id)}
    />
  );
};

const CrateLayoutInsertZone = ({
  insertIndex,
  disabled,
  onInsert,
  as: Tag = "li",
  variant = "inline",
  className,
}: CrateLayoutInsertZoneProps) => (
  <Tag
    className={classNames(styles.insertZone, className, {
      [styles.insertZoneEdgeTop]: variant === "edgeTop",
      [styles.insertZoneEdgeBottom]: variant === "edgeBottom",
    })}
  >
    <div className={styles.insertZoneHitArea}>
      <IconButton
        variant="plus"
        className={styles.insertButton}
        iconClassName={styles.insertButtonIcon}
        disabled={disabled}
        aria-label="Add section"
        onClick={() => onInsert(insertIndex)}
      >
        <PlusIcon />
      </IconButton>
    </div>
  </Tag>
);

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
  const { isUpdatingCrateLayout } = useCrateState();
  const [localLayoutItems, setLocalLayoutItems] = useState(layoutItems);
  const [focusMarkerId, setFocusMarkerId] = useState<string | null>(null);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localLayoutRef = useRef(localLayoutItems);

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
      filterCrateLayoutForHiddenPacked({
        items: localLayoutItems,
        hidePackedItems,
        isPacked,
      }),
    [hidePackedItems, isPacked, localLayoutItems],
  );

  const sortableIds = useMemo(
    () => visibleLayoutItems.map((item) => getCrateLayoutSortableId(item)),
    [visibleLayoutItems],
  );

  const releaseCount = useMemo(
    () => getCrateLayoutReleaseItems(localLayoutItems).length,
    [localLayoutItems],
  );

  const persistLayout = useCallback(
    (nextLayoutItems: CrateLayoutItem[]) => {
      const normalizedItems =
        assignSequentialCrateLayoutSortOrders(nextLayoutItems);
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

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const currentFullItems = localLayoutRef.current;
      const currentVisibleItems = filterCrateLayoutForHiddenPacked({
        items: currentFullItems,
        hidePackedItems,
        isPacked,
      });
      const reorderedVisibleItems = reorderCrateLayoutItems({
        items: currentVisibleItems,
        activeId: String(active.id),
        overId: String(over.id),
      });
      const nextFullItems = mergeReorderedVisibleCrateLayout({
        fullItems: currentFullItems,
        visibleItems: currentVisibleItems,
        reorderedVisibleItems,
      });

      persistLayout(nextFullItems);
    },
    [hidePackedItems, isPacked, persistLayout],
  );

  const handleAddSectionAt = useCallback(
    (insertIndex: number) => {
      const nextMarkerId = `${CRATE_TEMP_MARKER_PREFIX}${crypto.randomUUID()}`;
      const nextMarker: CrateLayoutMarkerItem = {
        kind: "marker",
        id: nextMarkerId,
        label: "New section",
        sort_order: 0,
      };
      const currentFullItems = localLayoutRef.current;
      const currentVisibleItems = filterCrateLayoutForHiddenPacked({
        items: currentFullItems,
        hidePackedItems,
        isPacked,
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
    [hidePackedItems, isPacked],
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

  const handleMarkerDelete = useCallback(
    (markerId: string) => {
      const nextItems = localLayoutRef.current.filter(
        (item) => !(item.kind === "marker" && item.id === markerId),
      );

      if (markerId.startsWith(CRATE_TEMP_MARKER_PREFIX)) {
        setLocalLayoutItems(nextItems);
        return;
      }

      persistLayout(nextItems);
    },
    [persistLayout],
  );

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

  const topInsertZone = (
    <CrateLayoutInsertZone
      as={useEdgeInsertMounts ? "div" : "li"}
      variant={useEdgeInsertMounts ? "edgeTop" : "inline"}
      insertIndex={0}
      disabled={isSavingLayout}
      onInsert={handleAddSectionAt}
    />
  );

  const bottomInsertZone = (
    <CrateLayoutInsertZone
      as={useEdgeInsertMounts ? "div" : "li"}
      variant={useEdgeInsertMounts ? "edgeBottom" : "inline"}
      insertIndex={visibleLayoutItems.length}
      disabled={isSavingLayout}
      onInsert={handleAddSectionAt}
    />
  );

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
      {useEdgeInsertMounts && topInsertMount
        ? createPortal(topInsertZone, topInsertMount)
        : null}
      {useEdgeInsertMounts && bottomInsertMount
        ? createPortal(bottomInsertZone, bottomInsertMount)
        : null}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortableIds}
          strategy={verticalListSortingStrategy}
        >
          <ul
            className={classNames(listStyles.list, styles.layoutList)}
            data-testid="fmdCrateReleasesTable"
          >
            {useEdgeInsertMounts ? null : topInsertZone}
            {visibleLayoutItems.map((item, index) => {
              const row =
                item.kind === "marker" ? (
                  <SortableMarkerRow
                    key={item.id}
                    marker={item}
                    autoFocus={focusMarkerId === item.id}
                    onLabelChange={handleMarkerLabelChange}
                    onDelete={handleMarkerDelete}
                  />
                ) : (
                  <SortableReleaseRow
                    key={item.instance_id}
                    item={item}
                    packedEnabled={packedEnabled}
                    packed={packedEnabled ? isPacked(item.instance_id) : false}
                    setPacked={setPacked}
                    removeFromCrate={removeFromCrate}
                    onReleaseClick={onReleaseClick}
                  />
                );

              return (
                <Fragment key={getCrateLayoutSortableId(item)}>
                  {row}
                  {item.kind !== "marker" &&
                  index + 1 < visibleLayoutItems.length ? (
                    <CrateLayoutInsertZone
                      insertIndex={index + 1}
                      disabled={isSavingLayout}
                      onInsert={handleAddSectionAt}
                    />
                  ) : null}
                </Fragment>
              );
            })}
            {useEdgeInsertMounts ? null : bottomInsertZone}
          </ul>
        </SortableContext>
      </DndContext>
    </>
  );
};

export const CrateLayoutList = memo(CrateLayoutListComponent);
