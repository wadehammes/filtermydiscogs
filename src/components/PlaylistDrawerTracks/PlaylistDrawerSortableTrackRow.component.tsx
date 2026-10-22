"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import classNames from "classnames";
import { PlaylistDrawerTrackItem } from "src/components/PlaylistDrawerTrackItem/PlaylistDrawerTrackItem.component";
import type { DiscogsRelease } from "src/types";
import type { PlaylistTrackRow } from "src/types/playlist.types";
import styles from "./PlaylistDrawerTracks.module.css";

export interface PlaylistDrawerSortableTrackRowProps {
  track: PlaylistTrackRow;
  release: DiscogsRelease | null;
  onReleaseClick?: (instanceId: string) => void;
  onPlayTrack: (track: PlaylistTrackRow) => void;
  onRemove: () => void;
  isRemovePending?: boolean;
}

export const PlaylistDrawerSortableTrackRow = ({
  track,
  release,
  onReleaseClick,
  onPlayTrack,
  onRemove,
  isRemovePending = false,
}: PlaylistDrawerSortableTrackRowProps) => {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: track.track_key,
    animateLayoutChanges: () => false,
  });

  return (
    <li
      ref={setNodeRef}
      className={classNames({ [styles.trackRowDragging]: isDragging })}
      style={{
        transform: CSS.Translate.toString(transform),
        transition: isDragging ? transition : undefined,
      }}
    >
      <PlaylistDrawerTrackItem
        track={track}
        release={release}
        onPlayTrack={onPlayTrack}
        {...(onReleaseClick ? { onReleaseClick } : {})}
        isRemovePending={isRemovePending}
        onRemove={onRemove}
        setDragHandleRef={setActivatorNodeRef}
        dragHandleAttributes={attributes}
        {...(listeners ? { dragHandleListeners: listeners } : {})}
        isDragging={isDragging}
      />
    </li>
  );
};
