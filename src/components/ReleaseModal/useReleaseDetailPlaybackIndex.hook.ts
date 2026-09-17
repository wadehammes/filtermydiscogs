import { useMemo } from "react";
import type { DiscogsTrack, DiscogsVideo } from "src/types";
import {
  buildReleasePlaybackMatchIndex,
  flattenTracklist,
} from "src/utils/releasePlayback";

interface UseReleaseDetailPlaybackIndexParams {
  tracklist: DiscogsTrack[] | undefined;
  videos: DiscogsVideo[] | undefined;
}

export const useReleaseDetailPlaybackIndex = ({
  tracklist,
  videos,
}: UseReleaseDetailPlaybackIndexParams) => {
  const tracks = useMemo(() => flattenTracklist(tracklist ?? []), [tracklist]);

  const resolvedVideos = useMemo(() => videos ?? [], [videos]);

  const playbackMatchIndex = useMemo(
    () => buildReleasePlaybackMatchIndex(tracks, resolvedVideos),
    [tracks, resolvedVideos],
  );

  return {
    tracks,
    videos: resolvedVideos,
    playbackMatchIndex,
  };
};
