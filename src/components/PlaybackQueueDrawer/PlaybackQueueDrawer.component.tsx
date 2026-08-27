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
import { useCallback, useMemo } from "react";
import { BottomDrawer } from "src/components/BottomDrawer/BottomDrawer.component";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import GripVerticalIcon from "src/styles/icons/grip-vertical-thin.svg";
import XIcon from "src/styles/icons/x-thin.svg";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { getReleaseImageUrl } from "src/utils/helpers";
import { getQueueItemKey } from "src/utils/playbackQueue";
import { formatArtistNames } from "src/utils/releaseDisplay";
import styles from "./PlaybackQueueDrawer.module.css";

interface PlaybackQueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SortableQueueItemProps {
  index: number;
  isActive: boolean;
  item: PlaybackQueueItem;
  onPlay: (index: number) => void;
  onRemove: (index: number) => void;
}

const SortableQueueItem = ({
  index,
  isActive,
  item,
  onPlay,
  onRemove,
}: SortableQueueItemProps) => {
  const sortableId = getQueueItemKey(item);
  const {
    attributes,
    listeners,
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
      <div
        className={classNames(styles.queueItem, {
          [styles.queueItemActive]: isActive,
        })}
      >
        <button
          type="button"
          className={styles.dragHandle}
          aria-label={`Reorder ${item.trackTitle}`}
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className={styles.dragHandleIcon} aria-hidden />
        </button>
        <button
          type="button"
          className={styles.queuePlayButton}
          onClick={() => {
            onPlay(index);
          }}
          aria-current={isActive ? "true" : undefined}
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
        <button
          type="button"
          className={styles.queueRemoveButton}
          onClick={() => {
            onRemove(index);
          }}
          aria-label={`Remove ${item.trackTitle} from queue`}
          title="Remove from queue"
        >
          <XIcon className={styles.queueRemoveIcon} aria-hidden />
        </button>
      </div>
    </li>
  );
};

export const PlaybackQueueDrawer = ({
  isOpen,
  onClose,
}: PlaybackQueueDrawerProps) => {
  const {
    queue,
    queueIndex,
    isPlaying,
    playQueueAtIndex,
    removeFromQueue,
    reorderQueue,
    clearQueue,
  } = useReleasePlayback();

  const sortableIds = useMemo(
    () => queue.map((item) => getQueueItemKey(item)),
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

      const fromIndex = queue.findIndex(
        (item) => getQueueItemKey(item) === active.id,
      );
      const toIndex = queue.findIndex(
        (item) => getQueueItemKey(item) === over.id,
      );

      if (fromIndex < 0 || toIndex < 0) {
        return;
      }

      reorderQueue(fromIndex, toIndex);
    },
    [queue, reorderQueue],
  );

  return (
    <BottomDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Playback queue"
      closeButtonAriaLabel="Close playback queue"
      closeButtonPlacement="header"
      dataAttribute="data-playback-queue-open"
      drawerClassName={classNames(
        styles.queueDrawer,
        styles.queueDrawerAlignEnd,
        styles.queueDrawerAlignEnd,
      )}
      behindMiniPlayer
      hideOverlay
      inline
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
        <p className={styles.emptyMessage} data-testid="fmdPlaybackQueueEmpty">
          Queue is empty. Hover a track and choose Add to queue.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            <ol className={styles.queueList} data-testid="fmdPlaybackQueueList">
              {queue.map((item, index) => (
                <SortableQueueItem
                  key={getQueueItemKey(item)}
                  index={index}
                  item={item}
                  isActive={isPlaying && index === queueIndex}
                  onPlay={playQueueAtIndex}
                  onRemove={removeFromQueue}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}
    </BottomDrawer>
  );
};
