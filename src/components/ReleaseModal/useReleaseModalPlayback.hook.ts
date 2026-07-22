import { useCallback, useEffect, useMemo, useState } from "react";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import type { DiscogsRelease } from "src/types";
import { formatArtistNames } from "src/utils/releaseDisplay";
import { isSameReleaseInstance, parseReleaseId } from "src/utils/releaseNotes";
import {
  buildYoutubeSearchUrl,
  flattenTracklist,
  getEmbeddableVideos,
} from "src/utils/releasePlayback";

interface UseReleaseModalPlaybackParams {
  release: DiscogsRelease;
  isOpen: boolean;
}

export const useReleaseModalPlayback = ({
  release,
  isOpen,
}: UseReleaseModalPlaybackParams) => {
  const playback = useReleasePlayback();
  const releaseId = parseReleaseId(release);
  const [selectedTrackPosition, setSelectedTrackPosition] = useState<
    string | null
  >(null);

  const isPlayingThisReleaseInBar =
    playback.isPlaying && isSameReleaseInstance(playback.release, release);

  const {
    data: releaseDetail,
    isLoading: isModalQueryLoading,
    isError,
    refetch,
  } = useDiscogsReleaseQuery({
    releaseId: releaseId !== null ? String(releaseId) : "",
    enabled: isOpen && releaseId !== null && !isPlayingThisReleaseInBar,
  });

  const tracks = useMemo(() => {
    if (isPlayingThisReleaseInBar) {
      return playback.tracks;
    }

    return flattenTracklist(releaseDetail?.tracklist ?? []);
  }, [isPlayingThisReleaseInBar, playback.tracks, releaseDetail?.tracklist]);

  const videos = isPlayingThisReleaseInBar
    ? playback.videos
    : (releaseDetail?.videos ?? []);

  const hasEmbeddableVideo = useMemo(
    () => getEmbeddableVideos(videos).length > 0,
    [videos],
  );

  const activeTrackPosition = isPlayingThisReleaseInBar
    ? playback.activeTrackPosition
    : selectedTrackPosition;

  const isLoading = isPlayingThisReleaseInBar
    ? playback.isLoading
    : isModalQueryLoading;

  const fallbackSearchUrl = buildYoutubeSearchUrl({
    artist: formatArtistNames(release),
    trackTitle: release.basic_information.title,
  });

  useEffect(() => {
    if (!isOpen) {
      setSelectedTrackPosition(null);
    }
  }, [isOpen]);

  const handleTrackSelect = useCallback(
    (trackPosition: string) => {
      setSelectedTrackPosition(trackPosition);
      playback.startPlayback({ release, trackPosition });
    },
    [playback.startPlayback, release],
  );

  const handleActiveTrackToggle = useCallback(() => {
    playback.togglePlayback();
  }, [playback.togglePlayback]);

  return {
    tracks,
    videos,
    hasEmbeddableVideo,
    activeTrackPosition,
    fallbackSearchUrl,
    isLoading,
    isError: isPlayingThisReleaseInBar ? false : isError,
    refetch,
    handleTrackSelect,
    handleActiveTrackToggle,
    isPlayingThisReleaseInBar,
    isPlaybackPaused: playback.isPaused,
  };
};
