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
import Link from "next/link";
import { memo, useCallback, useMemo } from "react";
import { BottomDrawer } from "src/components/BottomDrawer/BottomDrawer.component";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { SETTINGS_PLAYBACK_QUEUE_TAIL_HREF } from "src/components/Settings/settingsSections.constants";
import { PLAYBACK_QUEUE_LIST_LABEL } from "src/constants/accessibilityLabels.constants";
import { COMPACT_LAYOUT_MEDIA_QUERY } from "src/constants/layoutMediaQueries";
import {
  PLAYBACK_QUEUE_EMPTY_MESSAGE_DESKTOP,
  PLAYBACK_QUEUE_EMPTY_MESSAGE_TOUCH,
  PLAYBACK_QUEUE_TAIL_SETTINGS_LINK_LABEL,
} from "src/constants/playbackQueueEmptyCopy.constants";
import {
  useReleasePlaybackQueue,
  useReleasePlaybackState,
} from "src/context/releasePlayback.context";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import GripVerticalIcon from "src/styles/icons/grip-vertical-thin.svg";
import XIcon from "src/styles/icons/x-thin.svg";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { getReleaseImageUrl } from "src/utils/helpers";
import { getQueueItemListId } from "src/utils/playbackQueue";
import { resolvePlaybackQueueDrawerStatusMessage } from "src/utils/playbackQueueAutopopulate";
import { formatArtistNames } from "src/utils/releaseDisplay";
import styles from "./PlaybackQueueDrawer.module.css";

interface PlaybackQueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  elevateOverVideo?: boolean;
}

interface SortableQueueItemProps {
  index: number;
  item: PlaybackQueueItem;
  listId: string;
  onPlay: (index: number) => void;
  onRemove: (index: number) => void;
}

const SortableQueueItem = memo(function SortableQueueItem({
  index,
  item,
  listId,
  onPlay,
  onRemove,
}: SortableQueueItemProps) {
  const sortableId = listId;
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });
  const { basic_information } = item.release;
  const coverUrl = getReleaseImageUrl({
    thumb: basic_information.thumb,
    cover_image: basic_information.cover_image,
    width: 48,
    height: 48,
    preferCoverImage: true,
  });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={classNames({
        [styles.queueItemDragging]: isDragging,
      })}
    >
      <div className={styles.queueItem}>
        <IconButton
          ref={setActivatorNodeRef}
          variant="skip"
          className={styles.dragHandle}
          iconClassName={styles.dragHandleIcon}
          aria-label={`Reorder ${item.trackTitle}`}
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon />
        </IconButton>
        <button
          type="button"
          className={styles.queuePlayButton}
          onClick={() => {
            onPlay(index);
          }}
        >
          <Image
            src={coverUrl}
            alt=""
            width={48}
            height={48}
            className={styles.queueCover}
            sizes="48px"
          />
          <span className={styles.queueText}>
            <span className={styles.queueTrackTitle}>{item.trackTitle}</span>
            <span className={styles.queueReleaseMeta}>
              {basic_information.title}
              {" · "}
              {formatArtistNames(item.release)}
            </span>
          </span>
        </button>
        <IconButton
          variant="close"
          className={styles.queueRemoveButton}
          iconClassName={styles.queueRemoveIcon}
          onClick={() => {
            onRemove(index);
          }}
          aria-label={`Remove ${item.trackTitle} from queue`}
          title="Remove from queue"
        >
          <XIcon />
        </IconButton>
      </div>
    </li>
  );
});

export const PlaybackQueueDrawer = ({
  isOpen,
  onClose,
  elevateOverVideo = false,
}: PlaybackQueueDrawerProps) => {
  const { queue, playQueueAtIndex, removeFromQueue, reorderQueue, clearQueue } =
    useReleasePlaybackQueue();
  const { isQueueBuilding, isSimilarQueueLoading, queueAutopopulateSource } =
    useReleasePlaybackState();
  const isCompactLayout = useMediaQuery(COMPACT_LAYOUT_MEDIA_QUERY);
  const queueEmptyMessage = isCompactLayout
    ? PLAYBACK_QUEUE_EMPTY_MESSAGE_TOUCH
    : PLAYBACK_QUEUE_EMPTY_MESSAGE_DESKTOP;

  const stackQueueAboveExpandedVideo =
    Boolean(elevateOverVideo) && isCompactLayout;

  const queueStatusMessage = resolvePlaybackQueueDrawerStatusMessage({
    isAlbumQueueBuilding: isQueueBuilding,
    isSimilarQueueLoading,
    autopopulateSource: queueAutopopulateSource,
  });
  const queueListBusy = isQueueBuilding || isSimilarQueueLoading;
  const showQueueTailSettingsLink =
    isSimilarQueueLoading || queueAutopopulateSource === "similar-tail";

  const sortableIds = useMemo(
    () => queue.map((item, index) => getQueueItemListId(item, index)),
    [queue],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      const fromIndex = sortableIds.indexOf(String(active.id));
      const toIndex = sortableIds.indexOf(String(over.id));

      if (fromIndex < 0 || toIndex < 0) {
        return;
      }

      reorderQueue(fromIndex, toIndex);
    },
    [reorderQueue, sortableIds],
  );

  return (
    <BottomDrawer
      isOpen={isOpen}
      onClose={onClose}
      chrome
      contentFlush
      title="Queue"
      titleId="playback-queue-title"
      closeButtonAriaLabel="Close playback queue"
      dataAttribute="data-playback-queue-open"
      inlineAlignEnd
      drawerClassName={styles.queueDrawer}
      shellClassName={classNames(
        styles.queueDrawerShell,
        styles.queueLayer,
        elevateOverVideo && styles.queueDrawerOverVideo,
        elevateOverVideo && styles.queueElevated,
      )}
      aboveMiniPlayer={stackQueueAboveExpandedVideo}
      behindMiniPlayer={!stackQueueAboveExpandedVideo}
      hideOverlay
      inline={!stackQueueAboveExpandedVideo}
      footer={
        queue.length > 0 ? (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => {
              clearQueue();
              onClose();
            }}
          >
            Clear queue
          </button>
        ) : undefined
      }
    >
      {queue.length === 0 ? (
        <p
          className={styles.emptyMessage}
          data-testid="fmdPlaybackQueueEmpty"
          role="status"
          aria-label={queueEmptyMessage}
        >
          {queueEmptyMessage}
        </p>
      ) : (
        <>
          {queueStatusMessage ? (
            <p
              className={styles.buildingStatus}
              data-testid="fmdPlaybackQueueBuildingStatus"
              role="status"
              {...(queueAutopopulateSource
                ? { "data-queue-autopopulate-source": queueAutopopulateSource }
                : {})}
            >
              {queueStatusMessage}
              {showQueueTailSettingsLink ? (
                <>
                  {" "}
                  <Link
                    href={SETTINGS_PLAYBACK_QUEUE_TAIL_HREF}
                    className={styles.queueTailSettingsLink}
                  >
                    {PLAYBACK_QUEUE_TAIL_SETTINGS_LINK_LABEL}
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortableIds}
              strategy={verticalListSortingStrategy}
            >
              <ol
                className={styles.queueList}
                data-testid="fmdPlaybackQueueList"
                aria-busy={queueListBusy}
                aria-label={PLAYBACK_QUEUE_LIST_LABEL}
              >
                {queue.map((item, index) => {
                  const listId = getQueueItemListId(item, index);

                  return (
                    <SortableQueueItem
                      key={listId}
                      listId={listId}
                      index={index}
                      item={item}
                      onPlay={playQueueAtIndex}
                      onRemove={removeFromQueue}
                    />
                  );
                })}
              </ol>
            </SortableContext>
          </DndContext>
        </>
      )}
    </BottomDrawer>
  );
};
