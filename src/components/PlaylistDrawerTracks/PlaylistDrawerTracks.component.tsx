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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { EmptyState } from "src/components/EmptyState/EmptyState.component";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { usePlaylistDrawerContext } from "src/components/PlaylistDrawer/PlaylistDrawer.context";
import { PlaylistDrawerSortableTrackRow } from "src/components/PlaylistDrawerTracks/PlaylistDrawerSortableTrackRow.component";
import { useAuth } from "src/context/auth.context";
import {
  useRemoveTrackFromPlaylistMutation,
  useReorderPlaylistTracksMutation,
} from "src/hooks/mutations/usePlaylistMutations";
import { usePlaylistQuery } from "src/hooks/queries/usePlaylistsQuery";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import { usePlaylistPlayback } from "src/hooks/usePlaylistPlayback.hook";
import type { DiscogsRelease } from "src/types";
import type { PlaylistTrackRow } from "src/types/playlist.types";
import { writeLastPlayedPlaylistId } from "src/utils/lastPlayedPlaylistStorage";
import { applyPlaylistTrackOrder } from "src/utils/playlistTrackOrder";
import styles from "./PlaylistDrawerTracks.module.css";

const PlaylistDrawerTracksRoot = ({ children }: { children: ReactNode }) => (
  <div className={styles.root} data-testid="fmdPlaylistDrawerTracks">
    {children}
  </div>
);

export const PlaylistDrawerTracks = () => {
  const { activePlaylistId, onReleaseClick } = usePlaylistDrawerContext();
  const {
    state: { userId },
  } = useAuth();
  const allReleases = useAllReleases();
  const releaseByInstanceId = useMemo(() => {
    const map = new Map<string, DiscogsRelease>();

    for (const release of allReleases) {
      map.set(String(release.instance_id), release);
    }

    return map;
  }, [allReleases]);
  const { data: playlist, isLoading } = usePlaylistQuery({
    userId,
    playlistId: activePlaylistId,
    enabled: Boolean(activePlaylistId),
  });
  const playlistId = activePlaylistId ?? "";
  const removeTrackMutation = useRemoveTrackFromPlaylistMutation(playlistId);
  const reorderTracksMutation = useReorderPlaylistTracksMutation(playlistId);
  const { playPlaylistTrack, syncPlaylistQueueToTrackOrder } =
    usePlaylistPlayback();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const [displayTracks, setDisplayTracks] = useState<PlaylistTrackRow[] | null>(
    null,
  );
  const skipPlaylistSyncRef = useRef(false);
  const visibleTracks = displayTracks ?? playlist?.tracks ?? [];

  useLayoutEffect(() => {
    if (skipPlaylistSyncRef.current) {
      skipPlaylistSyncRef.current = false;
      return;
    }

    if (playlist) {
      setDisplayTracks(playlist.tracks);
    } else {
      setDisplayTracks(null);
    }
  }, [playlist]);

  const trackKeys = useMemo(
    () => visibleTracks.map((track) => track.track_key),
    [visibleTracks],
  );

  const handlePlayTrack = useCallback(
    (track: PlaylistTrackRow) => {
      if (userId && activePlaylistId) {
        writeLastPlayedPlaylistId(userId, activePlaylistId);
      }

      playPlaylistTrack(track, visibleTracks);
    },
    [activePlaylistId, playPlaylistTrack, userId, visibleTracks],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!(over && playlist) || active.id === over.id) {
        return;
      }

      const oldIndex = visibleTracks.findIndex(
        (track) => track.track_key === active.id,
      );
      const newIndex = visibleTracks.findIndex(
        (track) => track.track_key === over.id,
      );

      if (oldIndex < 0 || newIndex < 0) {
        return;
      }

      const previousPlaylist = playlist;
      const reordered = arrayMove(visibleTracks, oldIndex, newIndex);
      const trackKeys = reordered.map((track) => track.track_key);
      const reorderedPlaylist = applyPlaylistTrackOrder(
        previousPlaylist,
        trackKeys,
      );

      skipPlaylistSyncRef.current = true;
      flushSync(() => {
        setDisplayTracks(reorderedPlaylist.tracks);
      });

      syncPlaylistQueueToTrackOrder(reorderedPlaylist.tracks);
      reorderTracksMutation.mutate({
        trackKeys,
        previousPlaylist,
        optimisticPlaylist: reorderedPlaylist,
      });
    },
    [
      visibleTracks,
      playlist,
      reorderTracksMutation,
      syncPlaylistQueueToTrackOrder,
    ],
  );

  if (!activePlaylistId) {
    return (
      <PlaylistDrawerTracksRoot>
        <EmptyState
          variant="panel"
          title="No playlist selected"
          description="Create a playlist or pick one from the menu above."
          className={styles.emptyState}
        />
      </PlaylistDrawerTracksRoot>
    );
  }

  if (isLoading) {
    return (
      <PlaylistDrawerTracksRoot>
        <div className={styles.loadingState}>
          <PageLoader message="Loading playlist..." />
        </div>
      </PlaylistDrawerTracksRoot>
    );
  }

  if (!playlist) {
    return (
      <PlaylistDrawerTracksRoot>
        <EmptyState
          variant="panel"
          title="Playlist not found"
          description="Choose another playlist or create a new one."
          className={styles.emptyState}
        />
      </PlaylistDrawerTracksRoot>
    );
  }

  if (playlist.tracks.length === 0) {
    return (
      <PlaylistDrawerTracksRoot>
        <EmptyState
          variant="panel"
          title="No tracks yet"
          description="Use “Add to playlist” on a release tracklist."
          className={styles.emptyState}
        />
      </PlaylistDrawerTracksRoot>
    );
  }

  return (
    <PlaylistDrawerTracksRoot>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={trackKeys}
          strategy={verticalListSortingStrategy}
        >
          <ul className={styles.trackList}>
            {visibleTracks.map((track) => (
              <PlaylistDrawerSortableTrackRow
                key={track.track_key}
                track={track}
                release={
                  releaseByInstanceId.get(String(track.instance_id)) ?? null
                }
                onPlayTrack={handlePlayTrack}
                {...(onReleaseClick ? { onReleaseClick } : {})}
                isRemovePending={removeTrackMutation.isPending}
                onRemove={() => {
                  removeTrackMutation.mutate(track.track_key);
                }}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </PlaylistDrawerTracksRoot>
  );
};
