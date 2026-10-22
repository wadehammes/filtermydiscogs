"use client";

import type { DraggableAttributes } from "@dnd-kit/core";
import classNames from "classnames";
import Image from "next/image";
import type { MouseEvent, Ref } from "react";
import crateItemStyles from "src/components/CrateDrawerReleaseItem/CrateDrawerReleaseItem.module.css";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { PlayingIndicator } from "src/components/PlayingIndicator/PlayingIndicator.component";
import { useReleasePlaybackState } from "src/context/releasePlayback.context";
import { useReleaseCardOpenHandler } from "src/hooks/useReleaseCardOpenHandler.hook";
import GripVerticalIcon from "src/styles/icons/grip-vertical-thin.svg";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import stackStyles from "src/styles/modules/vertical-action-stack.module.css";
import type { DiscogsRelease } from "src/types";
import type { PlaylistTrackRow } from "src/types/playlist.types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseImageUrl } from "src/utils/helpers";
import { isPlaylistTrackActiveInPlayback } from "src/utils/playlistPlayback";
import styles from "./PlaylistDrawerTrackItem.module.css";

export interface PlaylistDrawerTrackItemProps {
  track: PlaylistTrackRow;
  release: DiscogsRelease | null;
  onReleaseClick?: (instanceId: string) => void;
  onPlayTrack: (track: PlaylistTrackRow) => void;
  onRemove: () => void;
  isRemovePending?: boolean;
  setDragHandleRef?: Ref<HTMLButtonElement>;
  dragHandleAttributes?: DraggableAttributes;
  dragHandleListeners?: object;
  isDragging?: boolean;
}

export const PlaylistDrawerTrackItem = ({
  track,
  release,
  onReleaseClick,
  onPlayTrack,
  onRemove,
  isRemovePending = false,
  setDragHandleRef,
  dragHandleAttributes,
  dragHandleListeners,
  isDragging = false,
}: PlaylistDrawerTrackItemProps) => {
  const playbackState = useReleasePlaybackState();
  const isActiveInPlayback =
    playbackState.isMiniPlayerVisible &&
    isPlaylistTrackActiveInPlayback(track, playbackState);
  const { openRelease, prefetchReleaseOpen, prefetchPointerProps, canOpen } =
    useReleaseCardOpenHandler({
      release,
      onReleaseClick,
    });

  const imageUrl = release
    ? getReleaseImageUrl({
        thumb: release.basic_information.thumb,
        cover_image: release.basic_information.cover_image,
        width: 100,
        height: 100,
        preferCoverImage: true,
      })
    : null;

  const handleRemove = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onRemove();
  };

  const handlePlay = () => {
    onPlayTrack(track);
  };

  const metaLine = [track.track_position, track.release_title]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={classNames(crateItemStyles.listItem, {
        [styles.listItemActive]: isActiveInPlayback,
        [styles.listItemDragging]: isDragging,
      })}
      data-testid="fmdPlaylistDrawerTrackItem"
      {...(isActiveInPlayback ? { "data-playlist-track-active": "" } : {})}
      {...definedProps(prefetchPointerProps ?? {})}
    >
      <button
        type="button"
        className={styles.artworkButton}
        onClick={openRelease}
        disabled={!canOpen}
        aria-label={
          release
            ? `Open ${release.basic_information.title}`
            : "Release not in collection"
        }
        {...definedProps(canOpen ? { onFocus: prefetchReleaseOpen } : {})}
      >
        <div
          className={classNames(crateItemStyles.itemImage, styles.artworkImage)}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              height={100}
              width={100}
              quality={100}
              alt={
                release?.basic_information.title ??
                track.release_title ??
                track.track_title
              }
              loading="lazy"
              sizes="100px"
            />
          ) : (
            <div className={styles.imagePlaceholder} aria-hidden />
          )}
          {isActiveInPlayback ? (
            <span className={styles.artworkPlayingOverlay} aria-hidden>
              <PlayingIndicator
                isPaused={playbackState.isPaused || !playbackState.isPlaying}
              />
            </span>
          ) : null}
        </div>
      </button>
      <div className={styles.trackMetaColumn}>
        <button
          type="button"
          className={styles.playButton}
          onClick={handlePlay}
          aria-label={
            isActiveInPlayback
              ? `Now playing ${track.track_title}`
              : `Play ${track.track_title}`
          }
          aria-current={isActiveInPlayback ? "true" : undefined}
        >
          <div className={crateItemStyles.itemContent}>
            {track.artist ? (
              <span
                className={classNames(
                  "typography-span",
                  crateItemStyles.itemArtist,
                )}
              >
                {track.artist}
              </span>
            ) : null}
            <span
              className={classNames(
                "typography-span",
                crateItemStyles.itemTitle,
                styles.trackTitleText,
              )}
            >
              {track.track_title}
            </span>
            {metaLine ? (
              <span
                className={classNames(
                  "typography-span",
                  crateItemStyles.itemLabel,
                )}
              >
                {metaLine}
              </span>
            ) : null}
          </div>
        </button>
      </div>
      <div className={crateItemStyles.listItemActions}>
        <div className={stackStyles.overlayActions}>
          {setDragHandleRef ? (
            <div className={stackStyles.overlayActionSlot}>
              <IconButton
                ref={setDragHandleRef}
                variant="skip"
                className={classNames(
                  stackStyles.overlayAction,
                  styles.dragHandle,
                )}
                iconClassName={styles.dragHandleIcon}
                aria-label={`Reorder ${track.track_title}`}
                {...(dragHandleAttributes ?? {})}
                {...(dragHandleListeners ?? {})}
              >
                <GripVerticalIcon />
              </IconButton>
            </div>
          ) : null}
          <div className={stackStyles.overlayActionSlot}>
            <IconButton
              variant="minus"
              className={classNames(
                stackStyles.overlayAction,
                crateItemStyles.removeAction,
              )}
              iconClassName={stackStyles.actionIcon}
              onClick={handleRemove}
              disabled={isRemovePending}
              aria-label={`Remove ${track.track_title} from playlist`}
              title="Remove from playlist"
            >
              <MinusIcon />
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );
};
