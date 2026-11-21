export const YOUTUBE_EMBED_PLAYER_WIDTH = 640;
export const YOUTUBE_EMBED_PLAYER_HEIGHT = 360;

export const postYoutubePlayerCommand = jest.fn();
export const requestYoutubeEmbedPlaybackSync = jest.fn();
export const syncYoutubeEmbedPlaybackProgress = (
  iframe: HTMLIFrameElement | null,
): void => {
  if (!iframe) {
    return;
  }

  requestYoutubeEmbedPlaybackSync(iframe);
};
export const loadYoutubeVideoById = jest.fn();
export const refreshYoutubeEmbedPlayerLayout = jest.fn();
export const loadAndPlayYoutubeVideo = jest.fn();
export const seekYoutubeEmbed = jest.fn();
export const setYoutubeEmbedVolume = jest.fn();
export const muteYoutubeEmbed = jest.fn();
export const unmuteYoutubeEmbed = jest.fn();
