import type {
  DiscogsTrack,
  DiscogsVideo,
} from "src/types/discogs-release-detail.types";
import { definedProps } from "src/utils/definedProps";

const YOUTUBE_ID_PATTERN =
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;

const MATCH_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "feat",
  "featuring",
  "ft",
  "in",
  "on",
  "the",
  "vs",
  "with",
]);

const extractVideoSongTitle = (title: string): string => {
  const dashIndex = title.lastIndexOf(" - ");

  if (dashIndex >= 0) {
    const suffix = title.slice(dashIndex + 3).trim();

    if (suffix.length >= 3) {
      return suffix;
    }
  }

  return title;
};

const getMatchTokens = (normalizedTitle: string): string[] => {
  return normalizedTitle
    .split(" ")
    .filter((token) => token.length >= 2 && !MATCH_STOP_WORDS.has(token));
};

const trackVideoTitlesMatch = (
  trackTitle: string,
  videoTitle: string,
): boolean => {
  const normalizedTrack = normalizeTrackTitle(trackTitle);

  if (normalizedTrack.length === 0) {
    return false;
  }

  const normalizedVideoSong = normalizeTrackTitle(
    extractVideoSongTitle(videoTitle),
  );
  const normalizedFullVideo = normalizeTrackTitle(videoTitle);

  if (
    normalizedVideoSong.includes(normalizedTrack) ||
    normalizedTrack.includes(normalizedVideoSong) ||
    normalizedFullVideo.includes(normalizedTrack) ||
    normalizedTrack.includes(normalizedFullVideo)
  ) {
    return true;
  }

  const trackTokens = getMatchTokens(normalizedTrack);

  if (trackTokens.length === 0) {
    return false;
  }

  const videoTokenSet = new Set([
    ...getMatchTokens(normalizedVideoSong),
    ...getMatchTokens(normalizedFullVideo),
  ]);

  return trackTokens.every((token) => videoTokenSet.has(token));
};

const scoreTrackVideoMatch = (
  trackTitle: string,
  videoTitle: string,
): number => {
  if (!trackVideoTitlesMatch(trackTitle, videoTitle)) {
    return 0;
  }

  const normalizedTrack = normalizeTrackTitle(trackTitle);
  const normalizedVideoSong = normalizeTrackTitle(
    extractVideoSongTitle(videoTitle),
  );
  const trackTokens = getMatchTokens(normalizedTrack);
  const videoTokenSet = new Set(getMatchTokens(normalizedVideoSong));
  const matchedTokenCount = trackTokens.filter((token) =>
    videoTokenSet.has(token),
  ).length;

  let score = matchedTokenCount / Math.max(trackTokens.length, 1);

  if (
    normalizedVideoSong.includes(normalizedTrack) ||
    normalizedTrack.includes(normalizedVideoSong)
  ) {
    score += 1;
  }

  return score;
};

export const dedupeVideosByYoutubeId = (
  videos: DiscogsVideo[],
): DiscogsVideo[] => {
  const seen = new Set<string>();
  const deduped: DiscogsVideo[] = [];

  for (const video of videos) {
    const key = parseYoutubeVideoId(video.uri) ?? video.uri;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(video);
  }

  return deduped;
};

const getVideoMatchLabel = (video: DiscogsVideo): string =>
  video.title.trim() || video.description?.trim() || "";

export const parseYoutubeVideoId = (uri: string): string | null => {
  const match = YOUTUBE_ID_PATTERN.exec(uri);

  return match?.[1] ?? null;
};

export const normalizeTrackTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const getEmbeddableVideos = (videos: DiscogsVideo[]): DiscogsVideo[] => {
  return dedupeVideosByYoutubeId(
    videos.filter(
      (video) =>
        video.embed !== false &&
        parseYoutubeVideoId(video.uri) !== null &&
        getVideoMatchLabel(video).length > 0,
    ),
  );
};

export const findVideoForTrack = ({
  track,
  videos,
}: {
  track: DiscogsTrack;
  videos: DiscogsVideo[];
}): DiscogsVideo | null => {
  const embeddableVideos = getEmbeddableVideos(videos);

  if (embeddableVideos.length === 0) {
    return null;
  }

  const normalizedTrackTitle = normalizeTrackTitle(track.title);

  if (normalizedTrackTitle.length === 0) {
    return null;
  }

  let bestVideo: DiscogsVideo | null = null;
  let bestScore = 0;

  for (const video of embeddableVideos) {
    const label = getVideoMatchLabel(video);
    const score = scoreTrackVideoMatch(track.title, label);

    if (score > bestScore) {
      bestScore = score;
      bestVideo = video;
    }
  }

  return bestVideo;
};

export const hasPlayableTrackVideo = (
  tracks: DiscogsTrack[],
  videos: DiscogsVideo[],
): boolean => {
  return tracks.some((track) => findVideoForTrack({ track, videos }) !== null);
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
): DiscogsVideo[] => {
  const embeddableVideos = getEmbeddableVideos(videos);
  const matchedVideoUris = new Set<string>();

  for (const track of tracks) {
    const matchedVideo = findVideoForTrack({ track, videos });

    if (matchedVideo) {
      matchedVideoUris.add(matchedVideo.uri);
    }
  }

  return embeddableVideos.filter((video) => !matchedVideoUris.has(video.uri));
};

export const isTrackVideoPlayable = ({
  track,
  videos,
}: {
  track: DiscogsTrack;
  videos: DiscogsVideo[];
}): boolean => findVideoForTrack({ track, videos }) !== null;

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
}): string => {
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

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
};

export const PLAY_FROM_GESTURE_RETRY_DELAYS_MS = [
  0, 150, 400, 800, 1500, 3000,
] as const;

export { postYoutubePlayerCommand } from "./postYoutubePlayerCommand";

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
  let index = startIndex + direction;

  while (index >= 0 && index < tracks.length) {
    const track = tracks[index];

    if (track && findVideoForTrack({ track, videos })) {
      return index;
    }

    index += direction;
  }

  return null;
};
