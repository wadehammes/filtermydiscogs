"use client";

import type { RefObject } from "react";
import { useReleaseDetailPlaybackIndex } from "src/components/ReleaseModal/useReleaseDetailPlaybackIndex.hook";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import type { DiscogsRelease, DiscogsTrack, DiscogsVideo } from "src/types";
import { parseReleaseId } from "src/utils/releaseNotes";
import type { ReleasePlaybackMatchIndex } from "src/utils/releasePlayback";

export const useReleasePlaybackReleaseDetail = ({
  release,
  isPlaying,
  tracksRef,
  videosRef,
  releaseDetailIdRef,
}: {
  release: DiscogsRelease | null;
  isPlaying: boolean;
  tracksRef: RefObject<DiscogsTrack[]>;
  videosRef: RefObject<DiscogsVideo[]>;
  releaseDetailIdRef: RefObject<number | undefined>;
}): {
  isLoading: boolean;
  playbackMatchIndex: ReleasePlaybackMatchIndex;
  releaseDetailId: number | undefined;
  releaseId: number | null;
  tracks: DiscogsTrack[];
  videos: DiscogsVideo[];
} => {
  const releaseId = release ? parseReleaseId(release) : null;

  const { data: releaseDetail, isLoading } = useDiscogsReleaseQuery({
    releaseId: releaseId !== null ? String(releaseId) : "",
    enabled: releaseId !== null && isPlaying,
  });

  const { tracks, videos, playbackMatchIndex } = useReleaseDetailPlaybackIndex({
    tracklist: releaseDetail?.tracklist,
    videos: releaseDetail?.videos,
  });

  tracksRef.current = tracks;
  videosRef.current = videos;
  releaseDetailIdRef.current = releaseDetail?.id;

  return {
    isLoading,
    playbackMatchIndex,
    releaseDetailId: releaseDetail?.id,
    releaseId,
    tracks,
    videos,
  };
};
