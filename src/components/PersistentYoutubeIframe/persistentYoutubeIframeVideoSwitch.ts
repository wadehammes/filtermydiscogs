export const imperativelySyncPersistentYoutubeIframeToVideoId = ({
  iframe,
  targetVideoId,
  loadedVideoId,
  notifyPlaybackVideoLoadStarted,
  notifyPlaybackVideoPresentationReady,
  loadAndPlayYoutubeVideo,
  refreshYoutubeEmbedPlayerLayout,
  enableYoutubeIframeListening,
}: {
  iframe: HTMLIFrameElement | null;
  targetVideoId: string;
  loadedVideoId: string | null;
  notifyPlaybackVideoLoadStarted: (videoId: string) => void;
  notifyPlaybackVideoPresentationReady: () => void;
  loadAndPlayYoutubeVideo: (args: {
    iframe: HTMLIFrameElement;
    videoId: string;
  }) => void;
  refreshYoutubeEmbedPlayerLayout: (args: {
    iframe: HTMLIFrameElement;
  }) => void;
  enableYoutubeIframeListening: (iframe: HTMLIFrameElement) => void;
}): string | null => {
  if (!iframe) {
    return loadedVideoId;
  }

  if (targetVideoId === loadedVideoId) {
    notifyPlaybackVideoPresentationReady();
    return loadedVideoId;
  }

  notifyPlaybackVideoLoadStarted(targetVideoId);
  loadAndPlayYoutubeVideo({ iframe, videoId: targetVideoId });
  refreshYoutubeEmbedPlayerLayout({ iframe });
  enableYoutubeIframeListening(iframe);

  return targetVideoId;
};
