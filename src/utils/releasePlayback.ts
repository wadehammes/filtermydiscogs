import type {
  DiscogsTrack,
  DiscogsVideo,
} from "src/types/discogs-release-detail.types";

const YOUTUBE_ID_PATTERN =
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;

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
  return videos.filter(
    (video) => video.embed !== false && parseYoutubeVideoId(video.uri) !== null,
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
    return embeddableVideos[0] ?? null;
  }

  for (const video of embeddableVideos) {
    const normalizedVideoTitle = normalizeTrackTitle(video.title);

    if (
      normalizedVideoTitle.includes(normalizedTrackTitle) ||
      normalizedTrackTitle.includes(normalizedVideoTitle)
    ) {
      return video;
    }
  }

  return embeddableVideos[0] ?? null;
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
    enablejsapi: "1",
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

export type YoutubePlayerCommand = "playVideo" | "pauseVideo";

export const postYoutubePlayerCommand = ({
  iframe,
  command,
}: {
  iframe: HTMLIFrameElement | null;
  command: YoutubePlayerCommand;
}): void => {
  if (!iframe?.contentWindow) {
    return;
  }

  iframe.contentWindow.postMessage(
    JSON.stringify({
      event: "command",
      func: command,
      args: "",
    }),
    "*",
  );
};

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
