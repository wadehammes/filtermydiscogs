const YOUTUBE_VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export const isValidYoutubeVideoId = (videoId: string): boolean =>
  YOUTUBE_VIDEO_ID_PATTERN.test(videoId);

export const buildYoutubeWatchUrl = (videoId: string): string | null => {
  if (!isValidYoutubeVideoId(videoId)) {
    return null;
  }

  const url = new URL("https://www.youtube.com/watch");
  url.searchParams.set("v", videoId);

  return url.href;
};

export const buildYoutubeNocookieEmbedPathUrl = (
  videoId: string,
  searchParams: URLSearchParams,
): string | null => {
  if (!isValidYoutubeVideoId(videoId)) {
    return null;
  }

  const url = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  url.search = searchParams.toString();

  return url.href;
};
