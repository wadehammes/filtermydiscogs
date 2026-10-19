import { describe, expect, it, jest } from "@jest/globals";
import { imperativelySyncPersistentYoutubeIframeToVideoId } from "src/components/PersistentYoutubeIframe/persistentYoutubeIframeVideoSwitch";

describe("imperativelySyncPersistentYoutubeIframeToVideoId", () => {
  it("notifies playback load started before imperative loadAndPlay", () => {
    const callOrder: string[] = [];
    const iframe = {} as HTMLIFrameElement;

    imperativelySyncPersistentYoutubeIframeToVideoId({
      iframe,
      targetVideoId: "abc12345678",
      loadedVideoId: "te2jJncBVG4",
      notifyPlaybackVideoLoadStarted: () => {
        callOrder.push("notifyPlaybackVideoLoadStarted");
      },
      notifyPlaybackVideoPresentationReady: jest.fn(),
      loadAndPlayYoutubeVideo: () => {
        callOrder.push("loadAndPlayYoutubeVideo");
      },
      refreshYoutubeEmbedPlayerLayout: jest.fn(),
      enableYoutubeIframeListening: jest.fn(),
    });

    expect(callOrder).toEqual([
      "notifyPlaybackVideoLoadStarted",
      "loadAndPlayYoutubeVideo",
    ]);
  });

  it("calls presentation ready without loadAndPlay when the upload is unchanged", () => {
    const notifyPlaybackVideoLoadStarted = jest.fn();
    const notifyPlaybackVideoPresentationReady = jest.fn();
    const loadAndPlayYoutubeVideo = jest.fn();
    const iframe = {} as HTMLIFrameElement;

    const nextLoadedVideoId = imperativelySyncPersistentYoutubeIframeToVideoId({
      iframe,
      targetVideoId: "te2jJncBVG4",
      loadedVideoId: "te2jJncBVG4",
      notifyPlaybackVideoLoadStarted,
      notifyPlaybackVideoPresentationReady,
      loadAndPlayYoutubeVideo,
      refreshYoutubeEmbedPlayerLayout: jest.fn(),
      enableYoutubeIframeListening: jest.fn(),
    });

    expect(nextLoadedVideoId).toBe("te2jJncBVG4");
    expect(notifyPlaybackVideoPresentationReady).toHaveBeenCalledTimes(1);
    expect(notifyPlaybackVideoLoadStarted).not.toHaveBeenCalled();
    expect(loadAndPlayYoutubeVideo).not.toHaveBeenCalled();
  });

  it("when the upload is unchanged but video UI loading is active, notifies load started and refreshes embed layout", () => {
    const notifyPlaybackVideoLoadStarted = jest.fn();
    const notifyPlaybackVideoPresentationReady = jest.fn();
    const refreshYoutubeEmbedPlayerLayout = jest.fn();
    const iframe = {} as HTMLIFrameElement;

    imperativelySyncPersistentYoutubeIframeToVideoId({
      iframe,
      targetVideoId: "te2jJncBVG4",
      loadedVideoId: "te2jJncBVG4",
      deferPresentationReadyWhenVideoUiLoading: true,
      notifyPlaybackVideoLoadStarted,
      notifyPlaybackVideoPresentationReady,
      loadAndPlayYoutubeVideo: jest.fn(),
      refreshYoutubeEmbedPlayerLayout,
      enableYoutubeIframeListening: jest.fn(),
    });

    expect(notifyPlaybackVideoPresentationReady).not.toHaveBeenCalled();
    expect(notifyPlaybackVideoLoadStarted).toHaveBeenCalledWith("te2jJncBVG4");
    expect(refreshYoutubeEmbedPlayerLayout).toHaveBeenCalledWith({ iframe });
  });
});
