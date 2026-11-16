import { afterEach, describe, expect, it } from "@jest/globals";
import {
  beginPlaybackDockVolumeForVideo,
  commitPlaybackDockVolumeOnPlayerEvent,
  EMPTY_PLAYBACK_DOCK_VOLUME_APPLY_MEMORY,
  registerPlaybackDockVolumeRestore,
  registerPlaybackDockVolumeSilence,
  resetPlaybackDockVolumeApplyMemory,
  resolvePlaybackDockVolumeOnPlayerEvent,
  restorePlaybackDockVolumeAfterTrackLoad,
} from "src/utils/playbackDockVolumeReapply";
import {
  YOUTUBE_PLAYER_STATE_CUED,
  YOUTUBE_PLAYER_STATE_PLAYING,
} from "src/utils/youtubeIframeEvents";

const playingStateChange = JSON.stringify({
  event: "onStateChange",
  info: YOUTUBE_PLAYER_STATE_PLAYING,
});

const playingInfoDelivery = JSON.stringify({
  event: "infoDelivery",
  info: { playerState: YOUTUBE_PLAYER_STATE_PLAYING, currentTime: 4 },
});

const cuedInfoDelivery = JSON.stringify({
  event: "infoDelivery",
  info: { playerState: YOUTUBE_PLAYER_STATE_CUED },
});

describe("playbackDockVolumeReapply", () => {
  afterEach(() => {
    registerPlaybackDockVolumeRestore(() => {});
    registerPlaybackDockVolumeSilence(() => {});
    resetPlaybackDockVolumeApplyMemory();
  });

  it("applies the remembered volume on the first playing state change for a video", () => {
    const first = resolvePlaybackDockVolumeOnPlayerEvent({
      data: playingStateChange,
      videoId: "abc12345678",
      memory: EMPTY_PLAYBACK_DOCK_VOLUME_APPLY_MEMORY,
    });

    expect(first.apply).toBe(true);
    expect(first.silence).toBe(true);

    const repeat = resolvePlaybackDockVolumeOnPlayerEvent({
      data: playingStateChange,
      videoId: "abc12345678",
      memory: first.memory,
    });

    expect(repeat.apply).toBe(false);
    expect(repeat.silence).toBe(false);
  });

  it("mutes a new video on player events until the remembered volume is applied", () => {
    const cued = resolvePlaybackDockVolumeOnPlayerEvent({
      data: cuedInfoDelivery,
      videoId: "abc12345678",
      memory: EMPTY_PLAYBACK_DOCK_VOLUME_APPLY_MEMORY,
    });

    expect(cued.silence).toBe(true);
    expect(cued.apply).toBe(false);
  });

  it("ignores a leftover playing info delivery until the player has left playing", () => {
    const stalePlaying = resolvePlaybackDockVolumeOnPlayerEvent({
      data: playingInfoDelivery,
      videoId: "def98765432",
      memory: {
        videoId: "abc12345678",
        sawNonPlaying: true,
        appliedVideoId: "abc12345678",
      },
    });

    expect(stalePlaying.apply).toBe(false);

    const cued = resolvePlaybackDockVolumeOnPlayerEvent({
      data: cuedInfoDelivery,
      videoId: "def98765432",
      memory: stalePlaying.memory,
    });

    expect(cued.apply).toBe(false);
    expect(cued.memory.sawNonPlaying).toBe(true);

    const playing = resolvePlaybackDockVolumeOnPlayerEvent({
      data: playingInfoDelivery,
      videoId: "def98765432",
      memory: cued.memory,
    });

    expect(playing.apply).toBe(true);
  });

  it("restores dock volume when the first playing state change applies", () => {
    const callOrder: string[] = [];
    const restoreVolume = jest.fn(() => {
      callOrder.push("restore");
    });
    const silenceVolume = jest.fn(() => {
      callOrder.push("silence");
    });
    registerPlaybackDockVolumeRestore(restoreVolume);
    registerPlaybackDockVolumeSilence(silenceVolume);

    commitPlaybackDockVolumeOnPlayerEvent({
      data: playingStateChange,
      videoId: "abc12345678",
    });

    expect(callOrder).toEqual(["silence", "restore"]);
    expect(restoreVolume).toHaveBeenCalledTimes(1);

    commitPlaybackDockVolumeOnPlayerEvent({
      data: playingInfoDelivery,
      videoId: "def98765432",
    });

    expect(restoreVolume).toHaveBeenCalledTimes(1);
    expect(silenceVolume).toHaveBeenCalledTimes(2);
  });

  it("mutes again when the same upload loads before the next playing event", () => {
    const silenceVolume = jest.fn();
    const restoreVolume = jest.fn();
    registerPlaybackDockVolumeSilence(silenceVolume);
    registerPlaybackDockVolumeRestore(restoreVolume);

    beginPlaybackDockVolumeForVideo("abc12345678");
    commitPlaybackDockVolumeOnPlayerEvent({
      data: playingStateChange,
      videoId: "abc12345678",
    });
    beginPlaybackDockVolumeForVideo("abc12345678");
    commitPlaybackDockVolumeOnPlayerEvent({
      data: playingStateChange,
      videoId: "abc12345678",
    });

    expect(silenceVolume).toHaveBeenCalledTimes(4);
    expect(restoreVolume).toHaveBeenCalledTimes(2);
  });

  it("mutes and then restores when player events arrive before the embed video id is set", () => {
    const silenceVolume = jest.fn();
    const restoreVolume = jest.fn();
    registerPlaybackDockVolumeSilence(silenceVolume);
    registerPlaybackDockVolumeRestore(restoreVolume);

    beginPlaybackDockVolumeForVideo("abc12345678");
    commitPlaybackDockVolumeOnPlayerEvent({
      data: cuedInfoDelivery,
      videoId: null,
    });
    commitPlaybackDockVolumeOnPlayerEvent({
      data: playingStateChange,
      videoId: null,
    });

    expect(silenceVolume).toHaveBeenCalledTimes(3);
    expect(restoreVolume).toHaveBeenCalledTimes(1);
  });

  it("invokes the dock volume restore registered for the playing event", () => {
    const restore = jest.fn();
    registerPlaybackDockVolumeRestore(restore);

    restorePlaybackDockVolumeAfterTrackLoad();

    expect(restore).toHaveBeenCalledTimes(1);
  });
});
