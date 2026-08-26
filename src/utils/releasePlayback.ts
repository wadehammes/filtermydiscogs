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

const MIN_FUZZY_MATCH_LENGTH = 3;
const SIDE_LETTER_CLASS = "[a-d]";
const MAX_DURATION_MATCH_DELTA_SECONDS = 30;

const GENERIC_TRACK_TITLES = new Set([
  "na",
  "n a",
  "tba",
  "track",
  "unknown",
  "unknown track",
  "untitled",
]);

const stringsOverlap = (
  left: string,
  right: string,
  minLength = MIN_FUZZY_MATCH_LENGTH,
): boolean => {
  if (left.length < minLength || right.length === 0) {
    return false;
  }

  return right.includes(left) || left.includes(right);
};

const normalizedTitlesOverlap = (
  normalizedTrack: string,
  normalizedVideo: string,
): boolean => {
  if (normalizedTrack.length === 0 || normalizedVideo.length === 0) {
    return false;
  }

  if (stringsOverlap(normalizedTrack, normalizedVideo, 1)) {
    return true;
  }

  return stringsOverlap(
    normalizedTrack.replace(/\s+/g, ""),
    normalizedVideo.replace(/\s+/g, ""),
  );
};

const stripToAlnum = (title: string): string => {
  return normalizeTrackTitle(title).replace(/[^\p{L}\p{N}]/gu, "");
};

const stripToAlnumForSideExtraction = (title: string): string => {
  return normalizeTrackTitle(title.replace(/\[[^\]]+\]/g, " ")).replace(
    /[^\p{L}\p{N}]/gu,
    "",
  );
};

const alnumIsSubsequence = (needle: string, haystack: string): boolean => {
  if (needle.length === 0) {
    return false;
  }

  let haystackIndex = 0;

  for (const character of needle) {
    haystackIndex = haystack.indexOf(character, haystackIndex);

    if (haystackIndex === -1) {
      return false;
    }

    haystackIndex += 1;
  }

  return true;
};

const alnumMultisetIsContained = (
  trackAlnum: string,
  videoAlnum: string,
): boolean => {
  const remainingCounts = new Map<string, number>();

  for (const character of videoAlnum) {
    remainingCounts.set(character, (remainingCounts.get(character) ?? 0) + 1);
  }

  for (const character of trackAlnum) {
    const remaining = remainingCounts.get(character) ?? 0;

    if (remaining === 0) {
      return false;
    }

    remainingCounts.set(character, remaining - 1);
  }

  return true;
};

const alnumTitlesOverlap = (
  trackAlnum: string,
  videoAlnum: string,
): boolean => {
  if (trackAlnum.length < MIN_FUZZY_MATCH_LENGTH) {
    return false;
  }

  if (stringsOverlap(trackAlnum, videoAlnum)) {
    return true;
  }

  if (alnumIsSubsequence(trackAlnum, videoAlnum)) {
    return true;
  }

  return alnumMultisetIsContained(trackAlnum, videoAlnum);
};

const extractAttachedSideSuffix = (title: string): string | null => {
  const attachedSideMatch = stripToAlnumForSideExtraction(title).match(
    new RegExp(`(?:[\\d\\p{Script=Han}])(${SIDE_LETTER_CLASS})$`, "u"),
  );

  return attachedSideMatch?.[1] ?? null;
};

const extractSideSuffixFromNormalized = (normalized: string): string | null => {
  const dashSideMatch = normalized.match(
    new RegExp(`\\s[-–—]\\s*(${SIDE_LETTER_CLASS}\\d*)\\s*$`),
  );

  if (dashSideMatch?.[1]) {
    return dashSideMatch[1].charAt(0);
  }

  const spaceSideMatch = normalized.match(
    new RegExp(`\\s(${SIDE_LETTER_CLASS})\\s*$`),
  );

  return spaceSideMatch?.[1] ?? null;
};

const extractTitleSideSuffix = (title: string): string | null => {
  return (
    extractSideSuffixFromNormalized(normalizeTrackTitle(title)) ??
    extractAttachedSideSuffix(title)
  );
};

const extractVideoSideSuffix = (title: string): string | null => {
  for (const candidate of [title, extractVideoSongTitle(title)]) {
    const side =
      extractSideSuffixFromNormalized(normalizeTrackTitle(candidate)) ??
      extractAttachedSideSuffix(candidate);

    if (side) {
      return side;
    }
  }

  return null;
};

const getTrackSideIdentifier = (track: DiscogsTrack): string | null => {
  return (
    extractTitleSideSuffix(track.title) ??
    track.position
      .trim()
      .toLowerCase()
      .match(/^([a-d])\d*/)?.[1] ??
    null
  );
};

interface TrackVideoMatchContext {
  normalizedTrack: string;
  normalizedVideoSong: string;
  normalizedFullVideo: string;
  trackAlnum: string;
  videoAlnum: string;
  videoSongAlnum: string;
  trackTokens: string[];
  videoTokenSet: Set<string>;
  trackSide: string | null;
  videoSide: string | null;
}

interface PreparedTrackMatchData {
  normalizedTrack: string;
  trackAlnum: string;
  trackTokens: string[];
  trackSide: string | null;
}

interface PreparedVideoMatchData {
  video: DiscogsVideo;
  normalizedVideoSong: string;
  normalizedFullVideo: string;
  videoAlnum: string;
  videoSongAlnum: string;
  videoTokenSet: Set<string>;
  videoSide: string | null;
}

const prepareTrackMatchData = (track: DiscogsTrack): PreparedTrackMatchData => {
  const normalizedTrack = normalizeTrackTitle(track.title);

  return {
    normalizedTrack,
    trackAlnum: stripToAlnum(track.title),
    trackTokens: getMatchTokens(normalizedTrack),
    trackSide: getTrackSideIdentifier(track),
  };
};

const prepareVideoMatchData = (video: DiscogsVideo): PreparedVideoMatchData => {
  const label = getVideoMatchLabel(video);
  const videoSongTitle = extractVideoSongTitle(label);
  const normalizedVideoSong = normalizeTrackTitle(videoSongTitle);
  const normalizedFullVideo = normalizeTrackTitle(label);

  return {
    video,
    normalizedVideoSong,
    normalizedFullVideo,
    videoAlnum: stripToAlnum(label),
    videoSongAlnum: stripToAlnum(videoSongTitle),
    videoTokenSet: new Set([
      ...getMatchTokens(normalizedVideoSong),
      ...getMatchTokens(normalizedFullVideo),
    ]),
    videoSide: extractVideoSideSuffix(label),
  };
};

const toMatchContext = (
  track: PreparedTrackMatchData,
  video: PreparedVideoMatchData,
): TrackVideoMatchContext => ({
  normalizedTrack: track.normalizedTrack,
  normalizedVideoSong: video.normalizedVideoSong,
  normalizedFullVideo: video.normalizedFullVideo,
  trackAlnum: track.trackAlnum,
  videoAlnum: video.videoAlnum,
  videoSongAlnum: video.videoSongAlnum,
  trackTokens: track.trackTokens,
  videoTokenSet: video.videoTokenSet,
  trackSide: track.trackSide,
  videoSide: video.videoSide,
});

const trackVideoSidesAreCompatible = (
  context: TrackVideoMatchContext,
): boolean => {
  if (!context.videoSide) {
    return true;
  }

  if (!context.trackSide) {
    return false;
  }

  return context.trackSide.charAt(0) === context.videoSide.charAt(0);
};

const titlesOverlapFromContext = (context: TrackVideoMatchContext): boolean => {
  if (
    normalizedTitlesOverlap(
      context.normalizedTrack,
      context.normalizedVideoSong,
    ) ||
    normalizedTitlesOverlap(
      context.normalizedTrack,
      context.normalizedFullVideo,
    )
  ) {
    return true;
  }

  return (
    alnumTitlesOverlap(context.trackAlnum, context.videoAlnum) ||
    alnumTitlesOverlap(context.trackAlnum, context.videoSongAlnum)
  );
};

const scorePreparedTrackVideoMatch = (
  track: PreparedTrackMatchData,
  video: PreparedVideoMatchData,
): number => {
  if (track.normalizedTrack.length === 0) {
    return 0;
  }

  const context = toMatchContext(track, video);

  if (!trackVideoSidesAreCompatible(context)) {
    return 0;
  }

  const overlaps = titlesOverlapFromContext(context);
  const tokensMatch =
    context.trackTokens.length > 0 &&
    context.trackTokens.every((token) => context.videoTokenSet.has(token));

  if (!(overlaps || tokensMatch)) {
    return 0;
  }

  const matchedTokenCount = context.trackTokens.filter((token) =>
    context.videoTokenSet.has(token),
  ).length;

  let score = matchedTokenCount / Math.max(context.trackTokens.length, 1);

  if (
    normalizedTitlesOverlap(
      context.normalizedTrack,
      context.normalizedVideoSong,
    )
  ) {
    score += 1;
  }

  if (
    alnumTitlesOverlap(context.trackAlnum, context.videoAlnum) ||
    alnumTitlesOverlap(context.trackAlnum, context.videoSongAlnum)
  ) {
    score += 1;
  }

  if (
    context.videoSide &&
    context.trackSide &&
    context.trackSide.charAt(0) === context.videoSide.charAt(0)
  ) {
    score += 2;
  }

  return score;
};

const findBestVideoForPreparedTrack = (
  preparedTrack: PreparedTrackMatchData,
  preparedVideos: PreparedVideoMatchData[],
): DiscogsVideo | null => {
  if (preparedTrack.normalizedTrack.length === 0) {
    return null;
  }

  let bestVideo: DiscogsVideo | null = null;
  let bestScore = 0;

  for (const preparedVideo of preparedVideos) {
    const score = scorePreparedTrackVideoMatch(preparedTrack, preparedVideo);

    if (score > bestScore) {
      bestScore = score;
      bestVideo = preparedVideo.video;
    }
  }

  return bestVideo;
};

export const parseTrackDurationToSeconds = (
  duration?: string,
): number | null => {
  if (!duration?.trim()) {
    return null;
  }

  const parts = duration
    .trim()
    .split(":")
    .map((part) => Number.parseInt(part, 10));

  if (parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;

    if (minutes === undefined || seconds === undefined) {
      return null;
    }

    return minutes * 60 + seconds;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;

    if (hours === undefined || minutes === undefined || seconds === undefined) {
      return null;
    }

    return hours * 3600 + minutes * 60 + seconds;
  }

  return null;
};

const isGenericTrackTitle = (title: string): boolean => {
  const normalized = normalizeTrackTitle(title);

  if (normalized.length === 0) {
    return true;
  }

  if (GENERIC_TRACK_TITLES.has(normalized)) {
    return true;
  }

  return (
    /^untitled(\s*\d+|\d+)?$/.test(normalized) ||
    /^unknown(\s*\d+|\d+)?$/.test(normalized) ||
    /^track\s+\d+$/.test(normalized) ||
    /^edit\s+\d+$/.test(normalized)
  );
};

const extractVideoTrackNumber = (title: string): number | null => {
  const match = normalizeTrackTitle(title).match(/\btrack\s+(\d+)\b/);

  if (!match?.[1]) {
    return null;
  }

  const trackNumber = Number.parseInt(match[1], 10);

  return Number.isNaN(trackNumber) ? null : trackNumber;
};

const compareTrackPositions = (left: string, right: string): number => {
  const toSortKey = (position: string): [number, number, string] => {
    const normalized = position.trim().toLowerCase();
    const sideMatch = normalized.match(/^([a-d])(\d*)/);

    if (sideMatch?.[1]) {
      return [
        sideMatch[1].charCodeAt(0),
        Number.parseInt(sideMatch[2] || "0", 10),
        normalized,
      ];
    }

    const numericMatch = normalized.match(/^(\d+)/);

    if (numericMatch?.[1]) {
      return [100, Number.parseInt(numericMatch[1], 10), normalized];
    }

    return [200, 0, normalized];
  };

  const leftKey = toSortKey(left);
  const rightKey = toSortKey(right);

  for (let index = 0; index < leftKey.length; index += 1) {
    const leftValue = leftKey[index];
    const rightValue = rightKey[index];

    if (leftValue === rightValue) {
      continue;
    }

    if (typeof leftValue === "string" && typeof rightValue === "string") {
      return leftValue.localeCompare(rightValue);
    }

    return (leftValue as number) - (rightValue as number);
  }

  return 0;
};

const sortVideosForGenericTrackMatching = (
  videos: DiscogsVideo[],
): DiscogsVideo[] => {
  const trackNumbers = videos.map((video) =>
    extractVideoTrackNumber(getVideoMatchLabel(video)),
  );

  if (trackNumbers.every((trackNumber) => trackNumber !== null)) {
    return [...videos].sort(
      (left, right) =>
        (extractVideoTrackNumber(getVideoMatchLabel(left)) ?? 0) -
        (extractVideoTrackNumber(getVideoMatchLabel(right)) ?? 0),
    );
  }

  return videos;
};

const matchGenericTracksToVideosByDuration = ({
  tracks,
  videos,
}: {
  tracks: DiscogsTrack[];
  videos: DiscogsVideo[];
}): Array<[DiscogsTrack, DiscogsVideo]> => {
  if (
    tracks.length === 0 ||
    tracks.length !== videos.length ||
    !tracks.every((track) => isGenericTrackTitle(track.title))
  ) {
    return [];
  }

  const sortedTracks = [...tracks].sort((left, right) =>
    compareTrackPositions(left.position, right.position),
  );
  const sortedVideos = sortVideosForGenericTrackMatching(videos);
  const pairs: Array<[DiscogsTrack, DiscogsVideo]> = [];

  for (let index = 0; index < sortedTracks.length; index += 1) {
    const track = sortedTracks[index];
    const video = sortedVideos[index];

    if (!(track && video)) {
      return [];
    }

    const trackDuration = parseTrackDurationToSeconds(track.duration);
    const videoDuration = video.duration;

    if (
      trackDuration === null ||
      videoDuration === undefined ||
      Math.abs(trackDuration - videoDuration) > MAX_DURATION_MATCH_DELTA_SECONDS
    ) {
      return [];
    }

    pairs.push([track, video]);
  }

  return pairs;
};

export interface ReleasePlaybackMatchIndex {
  embeddableVideos: DiscogsVideo[];
  trackVideoByPosition: ReadonlyMap<string, DiscogsVideo>;
  previewVideos: DiscogsVideo[];
  hasPlayableTracks: boolean;
}

export const buildReleasePlaybackMatchIndex = (
  tracks: DiscogsTrack[],
  videos: DiscogsVideo[],
): ReleasePlaybackMatchIndex => {
  const embeddableVideos = getEmbeddableVideos(videos);
  const preparedVideos = embeddableVideos.map(prepareVideoMatchData);
  const trackVideoByPosition = new Map<string, DiscogsVideo>();
  const matchedVideoUris = new Set<string>();

  for (const track of tracks) {
    const preparedTrack = prepareTrackMatchData(track);
    const bestVideo = findBestVideoForPreparedTrack(
      preparedTrack,
      preparedVideos,
    );

    if (bestVideo) {
      trackVideoByPosition.set(track.position, bestVideo);
      matchedVideoUris.add(bestVideo.uri);
    }
  }

  const unmatchedTracks = tracks.filter(
    (track) => !trackVideoByPosition.has(track.position),
  );
  const unmatchedVideos = embeddableVideos.filter(
    (video) => !matchedVideoUris.has(video.uri),
  );

  for (const [track, video] of matchGenericTracksToVideosByDuration({
    tracks: unmatchedTracks,
    videos: unmatchedVideos,
  })) {
    trackVideoByPosition.set(track.position, video);
    matchedVideoUris.add(video.uri);
  }

  return {
    embeddableVideos,
    trackVideoByPosition,
    previewVideos: embeddableVideos.filter(
      (video) => !matchedVideoUris.has(video.uri),
    ),
    hasPlayableTracks: trackVideoByPosition.size > 0,
  };
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

const getVideoDisplayLabel = (video: DiscogsVideo, fallback = ""): string =>
  video.title.trim() || video.description?.trim() || fallback;

const getVideoMatchLabel = (video: DiscogsVideo): string =>
  getVideoDisplayLabel(video);

export const parseYoutubeVideoId = (uri: string): string | null => {
  const match = YOUTUBE_ID_PATTERN.exec(uri);

  return match?.[1] ?? null;
};

export const normalizeTrackTitle = (title: string): string => {
  return title
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
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
  getVideoDisplayLabel(video, "Untitled video");

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
