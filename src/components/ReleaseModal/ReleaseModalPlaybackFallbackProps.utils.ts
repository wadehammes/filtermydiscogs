import type { DiscogsVideo } from "src/types";

export const getReleaseModalPlaybackFallbackProps = (
  videos: DiscogsVideo[],
  releasePreviewVideos: DiscogsVideo[],
) => ({
  fallbackVideos: releasePreviewVideos.length > 0 ? [] : videos,
  tracksLackMatchedVideos: videos.length > 0 || releasePreviewVideos.length > 0,
});
