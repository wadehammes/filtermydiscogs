import { useEffect, useMemo, useState } from "react";
import type { useReleasePlayback } from "src/context/releasePlayback.context";
import type { DiscogsRelease, DiscogsVideo } from "src/types";
import { isSameReleaseInstance } from "src/utils/releaseNotes";
import {
  getPreviewTrackPosition,
  parseYoutubeVideoId,
} from "src/utils/releasePlayback";

type ReleasePlaybackContextValue = ReturnType<typeof useReleasePlayback>;

interface UseReleaseModalPlaybackSelectionParams {
  release: DiscogsRelease;
  isOpen: boolean;
  playback: ReleasePlaybackContextValue;
  releasePreviewVideos: DiscogsVideo[];
}

export const useReleaseModalPlaybackSelection = ({
  release,
  isOpen,
  playback,
  releasePreviewVideos,
}: UseReleaseModalPlaybackSelectionParams) => {
  const [selectedTrackPosition, setSelectedTrackPosition] = useState<
    string | null
  >(null);

  const isPlayingThisReleaseInBar =
    playback.isPlaying && isSameReleaseInstance(playback.release, release);

  const activePreviewTrackPosition = useMemo(() => {
    if (
      !(
        isPlayingThisReleaseInBar &&
        playback.isReleasePreview &&
        playback.activeVideoId
      )
    ) {
      return null;
    }

    const video = releasePreviewVideos.find(
      (entry) => parseYoutubeVideoId(entry.uri) === playback.activeVideoId,
    );

    return video ? getPreviewTrackPosition(video) : null;
  }, [
    isPlayingThisReleaseInBar,
    playback.activeVideoId,
    playback.isReleasePreview,
    releasePreviewVideos,
  ]);

  const activeTrackPosition = isPlayingThisReleaseInBar
    ? playback.isReleasePreview
      ? null
      : playback.activeTrackPosition
    : selectedTrackPosition;

  useEffect(() => {
    if (!isOpen) {
      setSelectedTrackPosition(null);
    }
  }, [isOpen]);

  return {
    isPlayingThisReleaseInBar,
    activePreviewTrackPosition,
    activeTrackPosition,
    setSelectedTrackPosition,
  };
};
