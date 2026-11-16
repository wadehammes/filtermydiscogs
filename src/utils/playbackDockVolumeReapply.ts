import { YOUTUBE_PLAYER_STATE_PLAYING } from "src/utils/youtubeIframeEvents";

export interface PlaybackDockVolumeApplyMemory {
  videoId: string | null;
  sawNonPlaying: boolean;
  appliedVideoId: string | null;
}

export const EMPTY_PLAYBACK_DOCK_VOLUME_APPLY_MEMORY: PlaybackDockVolumeApplyMemory =
  {
    videoId: null,
    sawNonPlaying: false,
    appliedVideoId: null,
  };

let volumeApplyMemory: PlaybackDockVolumeApplyMemory = {
  ...EMPTY_PLAYBACK_DOCK_VOLUME_APPLY_MEMORY,
};

export const resetPlaybackDockVolumeApplyMemory = (): void => {
  volumeApplyMemory = { ...EMPTY_PLAYBACK_DOCK_VOLUME_APPLY_MEMORY };
};

type PlaybackDockVolumeCommand = () => void;

let restorePlaybackDockVolume: PlaybackDockVolumeCommand = () => {};
let silencePlaybackDockVolume: PlaybackDockVolumeCommand = () => {};

export const registerPlaybackDockVolumeRestore = (
  restore: PlaybackDockVolumeCommand,
) => {
  restorePlaybackDockVolume = restore;
};

export const registerPlaybackDockVolumeSilence = (
  silence: PlaybackDockVolumeCommand,
) => {
  silencePlaybackDockVolume = silence;
};

export const restorePlaybackDockVolumeAfterTrackLoad = () => {
  restorePlaybackDockVolume();
};

const silencePlaybackDockForTrackLoad = () => {
  silencePlaybackDockVolume();
};

export const beginPlaybackDockVolumeForVideo = (videoId: string): void => {
  volumeApplyMemory = {
    videoId,
    sawNonPlaying: false,
    appliedVideoId: null,
  };
  silencePlaybackDockForTrackLoad();
};

const readPlayerEvent = (
  data: unknown,
): {
  event: "infoDelivery" | "onStateChange";
  playerState: number;
} | null => {
  if (typeof data !== "string") {
    return null;
  }

  try {
    const payload = JSON.parse(data) as {
      event?: string;
      info?: unknown;
    };

    if (payload.event === "onStateChange" && typeof payload.info === "number") {
      return { event: "onStateChange", playerState: payload.info };
    }

    if (
      payload.event === "infoDelivery" &&
      typeof payload.info === "object" &&
      payload.info !== null &&
      "playerState" in payload.info &&
      typeof payload.info.playerState === "number"
    ) {
      return { event: "infoDelivery", playerState: payload.info.playerState };
    }
  } catch {
    return null;
  }

  return null;
};

export const resolvePlaybackDockVolumeOnPlayerEvent = ({
  data,
  videoId,
  memory,
}: {
  data: unknown;
  videoId: string | null;
  memory: PlaybackDockVolumeApplyMemory;
}): {
  apply: boolean;
  silence: boolean;
  memory: PlaybackDockVolumeApplyMemory;
} => {
  const playerEvent = readPlayerEvent(data);

  if (!(videoId && playerEvent)) {
    return { apply: false, silence: false, memory };
  }

  const nextMemory =
    memory.videoId === videoId
      ? memory
      : {
          videoId,
          sawNonPlaying: false,
          appliedVideoId: null,
        };
  const sawNonPlaying =
    nextMemory.sawNonPlaying ||
    playerEvent.playerState !== YOUTUBE_PLAYER_STATE_PLAYING;
  const awaitingRememberedVolume = nextMemory.appliedVideoId !== videoId;
  const apply =
    playerEvent.playerState === YOUTUBE_PLAYER_STATE_PLAYING &&
    awaitingRememberedVolume &&
    (playerEvent.event === "onStateChange" || nextMemory.sawNonPlaying);

  return {
    apply,
    silence: awaitingRememberedVolume,
    memory: {
      videoId,
      sawNonPlaying,
      appliedVideoId: apply ? videoId : nextMemory.appliedVideoId,
    },
  };
};

export const commitPlaybackDockVolumeOnPlayerEvent = ({
  data,
  videoId,
}: {
  data: unknown;
  videoId: string | null;
}): void => {
  const decision = resolvePlaybackDockVolumeOnPlayerEvent({
    data,
    videoId: videoId ?? volumeApplyMemory.videoId,
    memory: volumeApplyMemory,
  });
  volumeApplyMemory = decision.memory;

  if (decision.silence) {
    silencePlaybackDockForTrackLoad();
  }

  if (decision.apply) {
    restorePlaybackDockVolumeAfterTrackLoad();
  }
};
