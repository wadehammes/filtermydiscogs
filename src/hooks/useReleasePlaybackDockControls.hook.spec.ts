import { afterEach, describe, expect, it } from "@jest/globals";
import {
  resolvePlaybackDockEmbedProgressResetKey,
  useReleasePlaybackDockEmbedProgress,
  useReleasePlaybackDockTransport,
} from "src/hooks/useReleasePlaybackDockControls.hook";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  registerPlaybackDockVolumeRestore,
  restorePlaybackDockVolumeAfterTrackLoad,
} from "src/utils/playbackDockVolumeReapply";
import { writePlaybackDockVolume } from "src/utils/playbackDockVolumeStorage";
import {
  muteYoutubeEmbed,
  setYoutubeEmbedVolume,
  unmuteYoutubeEmbed,
} from "src/utils/postYoutubePlayerCommand";
import { act, renderHook } from "test-utils";

jest.mock("src/utils/postYoutubePlayerCommand");

const mockSetYoutubeEmbedVolume = setYoutubeEmbedVolume as jest.Mock<
  typeof setYoutubeEmbedVolume
>;
const mockUnmuteYoutubeEmbed = unmuteYoutubeEmbed as jest.Mock<
  typeof unmuteYoutubeEmbed
>;
const mockMuteYoutubeEmbed = muteYoutubeEmbed as jest.Mock<
  typeof muteYoutubeEmbed
>;

describe("useReleasePlaybackDockControls", () => {
  afterEach(() => {
    registerPlaybackDockVolumeRestore(() => {});
    localStorage.clear();
  });

  it("when preview video has a YouTube id, reset key uses preview:youtubeId", () => {
    const release = releaseFactory.build();

    expect(
      resolvePlaybackDockEmbedProgressResetKey({
        release,
        previewVideo: discogsVideoFactory.youtube({
          uri: "https://www.youtube.com/watch?v=abc12345678",
        }),
        playbackVideoId: "def98765432",
      }),
    ).toBe("preview:abc12345678");
  });

  it("when playing an album track, reset key uses playback video id when present", () => {
    const release = releaseFactory.build({ instance_id: "inst-1" });

    expect(
      resolvePlaybackDockEmbedProgressResetKey({
        release,
        previewVideo: null,
        playbackVideoId: "def98765432",
      }),
    ).toBe("def98765432");
  });

  it("re-exports embed progress reset and guard release from the dock embed hook", () => {
    const { result } = renderHook(() => useReleasePlaybackDockEmbedProgress());

    expect(result.current.resetEmbedProgress).toEqual(expect.any(Function));
    expect(result.current.releaseStaleEmbedProgressGuard).toEqual(
      expect.any(Function),
    );

    act(() => {
      result.current.resetEmbedProgress();
    });

    expect(result.current.embedProgress).toEqual({
      currentTime: 0,
      duration: null,
    });
  });

  it("when playback starts, the registered restore posts the stored dock volume", () => {
    writePlaybackDockVolume(35);
    const iframe = {
      contentWindow: { postMessage: jest.fn() },
    } as unknown as HTMLIFrameElement;
    const playbackIframeRef = { current: iframe };
    const lastInfoDeliveryCurrentTimeRef = { current: null as number | null };

    renderHook(() =>
      useReleasePlaybackDockTransport({
        playbackIframeRef,
        lastInfoDeliveryCurrentTimeRef,
        registerPlaybackIframeBase: () => undefined,
        embedProgress: null,
        applyLocalSeekSeconds: () => undefined,
        isPlaybackReady: true,
      }),
    );

    act(() => {
      restorePlaybackDockVolumeAfterTrackLoad();
    });

    expect(mockSetYoutubeEmbedVolume.mock.invocationCallOrder[0]).toBeLessThan(
      mockUnmuteYoutubeEmbed.mock.invocationCallOrder[0] ?? 0,
    );
    expect(mockSetYoutubeEmbedVolume).toHaveBeenCalledWith({
      iframe,
      volume: 35,
    });
    expect(mockMuteYoutubeEmbed).not.toHaveBeenCalled();
  });

  it("when the dock is muted, playback starts muted", () => {
    writePlaybackDockVolume(0);
    const iframe = {
      contentWindow: { postMessage: jest.fn() },
    } as unknown as HTMLIFrameElement;

    renderHook(() =>
      useReleasePlaybackDockTransport({
        playbackIframeRef: { current: iframe },
        lastInfoDeliveryCurrentTimeRef: { current: null },
        registerPlaybackIframeBase: () => undefined,
        embedProgress: null,
        applyLocalSeekSeconds: () => undefined,
        isPlaybackReady: true,
      }),
    );

    act(() => {
      restorePlaybackDockVolumeAfterTrackLoad();
    });

    expect(mockMuteYoutubeEmbed).toHaveBeenCalledWith(iframe);
    expect(mockSetYoutubeEmbedVolume).not.toHaveBeenCalled();
    expect(mockUnmuteYoutubeEmbed).not.toHaveBeenCalled();
  });
});
