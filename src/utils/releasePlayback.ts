import { appendE2eEmbedMockQueryParams } from "src/constants/e2eEmbedMock.constants";
import {
  E2E_MOCK_YOUTUBE_EMBED_PATH,
  shouldUseE2eMockYoutubeEmbedForVideo,
} from "src/constants/e2ePlayback.constants";
import type {
  DiscogsTrack,
  DiscogsVideo,
} from "src/types/discogs-release-detail.types";
import { definedProps } from "src/utils/definedProps";
import {
  buildReleasePlaybackMatchIndex,
  type ReleasePlaybackMatchIndex,
} from "src/utils/releasePlaybackTrackVideoMatching";
import {
  buildYoutubeNocookieEmbedPathUrl,
  isValidYoutubeVideoId,
} from "src/utils/youtubeVideoId";

export {
  buildReleasePlaybackMatchIndex,
  parseYoutubeVideoId,
  type ReleasePlaybackMatchIndex,
} from "src/utils/releasePlaybackTrackVideoMatching";

export const resolvePlayableTrackAtPosition = ({
  trackPosition,
  tracks,
  playbackMatchIndex,
}: {
  trackPosition: string;
  tracks: DiscogsTrack[];
  playbackMatchIndex: ReleasePlaybackMatchIndex;
}): { track: DiscogsTrack; matchedVideo: DiscogsVideo } | null => {
  if (!playbackMatchIndex.trackVideoByPosition.has(trackPosition)) {
    return null;
  }

  const track = tracks.find((entry) => entry.position === trackPosition);

  if (!track) {
    return null;
  }

  const matchedVideo =
    playbackMatchIndex.trackVideoByPosition.get(trackPosition);

  if (!matchedVideo) {
    return null;
  }

  return { track, matchedVideo };
};

export const findVideoForTrack = ({
  track,
  tracks,
  videos,
  matchIndex,
}: {
  track: DiscogsTrack;
  tracks?: DiscogsTrack[];
  videos: DiscogsVideo[];
  matchIndex?: ReleasePlaybackMatchIndex;
}): DiscogsVideo | null => {
  const resolvedMatchIndex =
    matchIndex ?? buildReleasePlaybackMatchIndex(tracks ?? [track], videos);

  return resolvedMatchIndex.trackVideoByPosition.get(track.position) ?? null;
};

export const hasPlayableTrackVideo = (
  tracks: DiscogsTrack[],
  videos: DiscogsVideo[],
  matchIndex?: ReleasePlaybackMatchIndex,
): boolean => {
  if (matchIndex) {
    return matchIndex.hasPlayableTracks;
  }

  return buildReleasePlaybackMatchIndex(tracks, videos).hasPlayableTracks;
};

export const PREVIEW_TRACK_POSITION_PREFIX = "preview:";

export const getPreviewTrackPosition = (video: DiscogsVideo): string =>
  `${PREVIEW_TRACK_POSITION_PREFIX}${video.uri}`;

export const isPreviewTrackPosition = (position: string): boolean =>
  position.startsWith(PREVIEW_TRACK_POSITION_PREFIX);

export const getPreviewVideoUriFromPosition = (
  position: string,
): string | null => {
  if (!isPreviewTrackPosition(position)) {
    return null;
  }

  return position.slice(PREVIEW_TRACK_POSITION_PREFIX.length);
};

export const findPreviewVideoForTrackPosition = ({
  trackPosition,
  releasePreviewVideos,
}: {
  trackPosition: string;
  releasePreviewVideos: DiscogsVideo[];
}): DiscogsVideo | null => {
  const videoUri = getPreviewVideoUriFromPosition(trackPosition);

  if (!videoUri) {
    return null;
  }

  return releasePreviewVideos.find((entry) => entry.uri === videoUri) ?? null;
};

export const formatVideoDuration = (
  durationInSeconds?: number,
): string | undefined => {
  if (durationInSeconds === undefined) {
    return undefined;
  }

  const totalSeconds = Math.max(0, Math.round(durationInSeconds));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const getPreviewVideoTitle = (video: DiscogsVideo): string =>
  video.title.trim() || video.description?.trim() || "Untitled video";

export const previewVideoToTrack = (video: DiscogsVideo): DiscogsTrack => ({
  position: getPreviewTrackPosition(video),
  title: getPreviewVideoTitle(video),
  type_: "track",
  ...definedProps({
    duration: formatVideoDuration(video.duration),
  }),
});

export const previewVideosToTracks = (videos: DiscogsVideo[]): DiscogsTrack[] =>
  videos.map((video) => previewVideoToTrack(video));

export const getReleasePreviewVideos = (
  tracks: DiscogsTrack[],
  videos: DiscogsVideo[],
  matchIndex?: ReleasePlaybackMatchIndex,
): DiscogsVideo[] => {
  if (matchIndex) {
    return matchIndex.previewVideos;
  }

  return buildReleasePlaybackMatchIndex(tracks, videos).previewVideos;
};

export const isTrackVideoPlayable = ({
  track,
  videos,
  matchIndex,
}: {
  track: DiscogsTrack;
  videos: DiscogsVideo[];
  matchIndex?: ReleasePlaybackMatchIndex;
}): boolean => {
  if (matchIndex) {
    return matchIndex.trackVideoByPosition.has(track.position);
  }

  return findVideoForTrack({ track, videos }) !== null;
};

export const findTrackIndexByPosition = (
  tracks: DiscogsTrack[],
  position: string,
): number => {
  return tracks.findIndex((track) => track.position === position);
};

export const flattenTracklist = (tracklist: DiscogsTrack[]): DiscogsTrack[] => {
  const flattened: DiscogsTrack[] = [];

  for (const track of tracklist) {
    if (track.sub_tracks && track.sub_tracks.length > 0) {
      flattened.push(...flattenTracklist(track.sub_tracks));
      continue;
    }

    const trackType = track.type_ ?? "track";

    if (trackType === "track" && track.title.trim().length > 0) {
      flattened.push(track);
    }
  }

  return flattened;
};

export const buildYoutubeSearchUrl = ({
  artist,
  trackTitle,
}: {
  artist: string;
  trackTitle: string;
}): string => {
  const query = encodeURIComponent(`${artist} ${trackTitle}`.trim());

  return `https://www.youtube.com/results?search_query=${query}`;
};

export const buildYoutubeEmbedUrl = ({
  videoId,
  autoplay = false,
  origin,
}: {
  videoId: string;
  autoplay?: boolean;
  origin?: string;
}): string | null => {
  if (!isValidYoutubeVideoId(videoId)) {
    return null;
  }

  const params = new URLSearchParams({
    controls: "1",
    disablekb: "0",
    enablejsapi: "1",
    fs: "1",
    playsinline: "1",
    rel: "0",
  });

  if (autoplay) {
    params.set("autoplay", "1");
  }

  if (origin) {
    params.set("origin", origin);
  }

  if (shouldUseE2eMockYoutubeEmbedForVideo(videoId)) {
    params.set("videoId", videoId);
    appendE2eEmbedMockQueryParams(params, videoId);
    return `${E2E_MOCK_YOUTUBE_EMBED_PATH}?${params.toString()}`;
  }

  return buildYoutubeNocookieEmbedPathUrl(videoId, params);
};

export const buildClientYoutubeEmbedUrl = ({
  videoId,
  autoplay = false,
}: {
  videoId: string;
  autoplay?: boolean;
}): string | null => {
  const origin =
    typeof window !== "undefined" ? window.location.origin : undefined;

  return buildYoutubeEmbedUrl({
    videoId,
    autoplay,
    ...definedProps({ origin }),
  });
};

export const PLAY_FROM_GESTURE_RETRY_DELAYS_MS = [
  0, 150, 400, 800, 1500, 3000,
] as const;

export {
  loadAndPlayYoutubeVideo,
  loadYoutubeVideoById,
  postYoutubePlayerCommand,
  refreshYoutubeEmbedPlayerLayout,
} from "./postYoutubePlayerCommand";

export const findPlayableTrackIndex = ({
  tracks,
  videos,
  startIndex,
  direction,
}: {
  tracks: DiscogsTrack[];
  videos: DiscogsVideo[];
  startIndex: number;
  direction: 1 | -1;
}): number | null => {
  const matchIndex = buildReleasePlaybackMatchIndex(tracks, videos);
  let index = startIndex + direction;

  while (index >= 0 && index < tracks.length) {
    const track = tracks[index];

    if (track && matchIndex.trackVideoByPosition.has(track.position)) {
      return index;
    }

    index += direction;
  }

  return null;
};
