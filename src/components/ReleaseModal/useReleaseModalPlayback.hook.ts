import { useCallback, useMemo, useState } from "react";
import { useReleaseDetailPlaybackIndex } from "src/components/ReleaseModal/useReleaseDetailPlaybackIndex.hook";
import { useReleaseModalPlaybackQueue } from "src/components/ReleaseModal/useReleaseModalPlaybackQueue.hook";
import { useReleaseModalPlaybackSelection } from "src/components/ReleaseModal/useReleaseModalPlaybackSelection.hook";
import { useReleaseModalPlaybackTrackActions } from "src/components/ReleaseModal/useReleaseModalPlaybackTrackActions.hook";
import { useReleaseModalReleaseDetailQuery } from "src/components/ReleaseModal/useReleaseModalReleaseDetailQuery.hook";
import type { TrackYoutubeOverrideTarget } from "src/components/TrackYoutubeOverrideDialog/TrackYoutubeOverrideDialog.component";
import { useAuth } from "src/context/auth.context";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import { useTrackStatsQuery } from "src/hooks/queries/useTrackStatsQuery";
import type { DiscogsRelease } from "src/types";
import { getQueueItemKey } from "src/utils/playbackQueue";
import { formatArtistNames } from "src/utils/releaseDisplay";
import { parseReleaseId } from "src/utils/releaseNotes";
import {
  buildYoutubeSearchUrl,
  previewVideosToTracks,
} from "src/utils/releasePlayback";
import {
  isTrackPositionPlayableWithOverrides,
  resolveTrackPlaybackYoutubeVideoId,
} from "src/utils/trackPlaybackYoutube";
import {
  buildTrackKey,
  mapTrackStatsByPosition,
  mapUserYoutubeIdsByPosition,
  normalizeTrackStatsKeys,
} from "src/utils/userTrack";

interface UseReleaseModalPlaybackParams {
  release: DiscogsRelease;
  isOpen: boolean;
}

export const useReleaseModalPlayback = ({
  release,
  isOpen,
}: UseReleaseModalPlaybackParams) => {
  const playback = useReleasePlayback();
  const { state: authState } = useAuth();
  const [youtubeOverridePosition, setYoutubeOverridePosition] = useState<
    string | null
  >(null);
  const releaseId = parseReleaseId(release);
  const releaseIdString = releaseId !== null ? String(releaseId) : "";
  const queryEnabled = isOpen && releaseId !== null;

  const { releaseDetail, isLoading, isError, refetch } =
    useReleaseModalReleaseDetailQuery({
      releaseIdString,
      enabled: queryEnabled,
    });

  const { tracks, videos, playbackMatchIndex } = useReleaseDetailPlaybackIndex({
    tracklist: releaseDetail?.tracklist,
    videos: releaseDetail?.videos,
  });

  const hasEmbeddableVideo = playbackMatchIndex.embeddableVideos.length > 0;

  const hasPlayableTracks = playbackMatchIndex.hasPlayableTracks;

  const releasePreviewVideos = playbackMatchIndex.previewVideos;

  const {
    isPlayingThisReleaseInBar,
    activePreviewTrackPosition,
    activeTrackPosition,
    setSelectedTrackPosition,
  } = useReleaseModalPlaybackSelection({
    release,
    isOpen,
    playback,
    releasePreviewVideos,
  });

  const releasePreviewTracks = useMemo(
    () => previewVideosToTracks(releasePreviewVideos),
    [releasePreviewVideos],
  );

  const trackKeys = useMemo(() => {
    const keys = new Set<string>();

    for (const track of tracks) {
      keys.add(buildTrackKey(release.instance_id, track.position));
    }

    for (const item of playback.queue) {
      keys.add(getQueueItemKey(item));
    }

    const queueKeys = playback.queue.map((item) => getQueueItemKey(item));

    return normalizeTrackStatsKeys([...keys], { prioritizeKeys: queueKeys });
  }, [playback.queue, release.instance_id, tracks]);

  const { data: trackStatsResponse } = useTrackStatsQuery({
    userId: authState.userId,
    trackKeys,
    enabled: authState.isAuthenticated && queryEnabled && tracks.length > 0,
  });

  const userYoutubeIdByPosition = useMemo(
    () =>
      mapUserYoutubeIdsByPosition(
        release.instance_id,
        tracks,
        trackStatsResponse?.stats,
      ),
    [release.instance_id, trackStatsResponse?.stats, tracks],
  );

  const trackStatsByPosition = useMemo(
    () =>
      mapTrackStatsByPosition(
        release.instance_id,
        tracks,
        trackStatsResponse?.stats,
      ),
    [release.instance_id, trackStatsResponse?.stats, tracks],
  );

  const hasUserYoutubeOverrides =
    Object.keys(userYoutubeIdByPosition).length > 0;
  const hasTracklistPlayback = hasPlayableTracks || hasUserYoutubeOverrides;

  const isTrackPlayable = useCallback(
    (trackPosition: string) =>
      isTrackPositionPlayableWithOverrides({
        trackPosition,
        playbackMatchIndex,
        userYoutubeIdByPosition,
      }),
    [playbackMatchIndex, userYoutubeIdByPosition],
  );

  const youtubeOverrideTarget =
    useMemo((): TrackYoutubeOverrideTarget | null => {
      if (!youtubeOverridePosition) {
        return null;
      }

      const track = tracks.find(
        (row) => row.position === youtubeOverridePosition,
      );

      if (!track) {
        return null;
      }

      const savedYoutubeId =
        userYoutubeIdByPosition[youtubeOverridePosition]?.trim() ?? "";
      const hasUserOverride = savedYoutubeId.length > 0;
      const hasDefaultYoutubeEmbed =
        isTrackPlayable(youtubeOverridePosition) && !hasUserOverride;
      const initialPreviewVideoId = resolveTrackPlaybackYoutubeVideoId({
        trackPosition: youtubeOverridePosition,
        tracks,
        playbackMatchIndex,
        userYoutubeIdByPosition,
      });

      return {
        trackKey: buildTrackKey(release.instance_id, track.position),
        trackPosition: track.position,
        trackTitle: track.title,
        instanceId: String(release.instance_id),
        artist: formatArtistNames(release),
        releaseTitle: release.basic_information.title,
        discogsReleaseId: release.basic_information.id ?? null,
        initialYoutubeId: hasUserOverride ? savedYoutubeId : null,
        hasDefaultYoutubeEmbed,
        initialPreviewVideoId,
      };
    }, [
      isTrackPlayable,
      playbackMatchIndex,
      release,
      tracks,
      userYoutubeIdByPosition,
      youtubeOverridePosition,
    ]);

  const openTrackYoutubeOverride = useCallback((trackPosition: string) => {
    setYoutubeOverridePosition(trackPosition);
  }, []);

  const closeTrackYoutubeOverride = useCallback(() => {
    setYoutubeOverridePosition(null);
  }, []);

  const fallbackSearchUrl = buildYoutubeSearchUrl({
    artist: formatArtistNames(release),
    trackTitle: release.basic_information.title,
  });

  const {
    handleTrackSelect,
    startAlbumTrackWithYoutubeVideoId,
    handleTrackQueue,
    handleReleasePreview,
    handlePreviewTrackSelect,
    handlePreviewTrackQueue,
  } = useReleaseModalPlaybackTrackActions({
    release,
    tracks,
    playbackMatchIndex,
    releasePreviewVideos,
    setSelectedTrackPosition,
    userYoutubeIdByPosition,
  });

  const {
    isTrackQueued,
    isTrackUnqueueable,
    isPreviewTrackQueued,
    isPreviewTrackUnqueueable,
    allPlayableTracksQueued,
    handleAddAllToQueue,
    handleRemoveAllFromQueue,
    handleTrackUnqueue,
    handlePreviewTrackUnqueue,
  } = useReleaseModalPlaybackQueue({
    release,
    tracks,
    playbackMatchIndex,
    userYoutubeIdByPosition,
  });

  return {
    tracks,
    videos,
    hasEmbeddableVideo,
    hasPlayableTracks,
    hasTracklistPlayback,
    releasePreviewVideos,
    releasePreviewTracks,
    isTrackPlayable,
    trackStatsByPosition,
    userYoutubeIdByPosition,
    youtubeOverrideTarget,
    openTrackYoutubeOverride,
    closeTrackYoutubeOverride,
    activeTrackPosition,
    activePreviewTrackPosition,
    fallbackSearchUrl,
    isLoading,
    isError,
    refetch,
    handleTrackSelect,
    startAlbumTrackWithYoutubeVideoId,
    handleTrackQueue,
    handleAddAllToQueue,
    handleRemoveAllFromQueue,
    handleTrackUnqueue,
    handlePreviewTrackUnqueue,
    allPlayableTracksQueued,
    handleReleasePreview,
    handlePreviewTrackSelect,
    handlePreviewTrackQueue,
    isTrackQueued,
    isTrackUnqueueable,
    isPreviewTrackQueued,
    isPreviewTrackUnqueueable,
    handleActiveTrackToggle: playback.togglePlayback,
    isPlayingThisReleaseInBar,
    isPlaybackPaused: playback.isPaused,
    isReleasePreviewPlaying:
      isPlayingThisReleaseInBar && playback.isReleasePreview,
  };
};

export type ReleaseModalPlaybackState = ReturnType<
  typeof useReleaseModalPlayback
>;
