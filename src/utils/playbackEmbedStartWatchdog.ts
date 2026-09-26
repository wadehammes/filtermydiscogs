export const PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS = 5000;

export const PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MOBILE_MS = 12000;

export const PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MODERATE_MS = 12000;

export const PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_SLOW_MS = 18000;

export type PlaybackEmbedConnectionQuality =
  | "slow"
  | "moderate"
  | "fast"
  | "unknown";

export interface NetworkInformationLike {
  downlink?: number;
  effectiveType?: string;
  saveData?: boolean;
}

const SLOW_EFFECTIVE_TYPES = new Set(["slow-2g", "2g"]);

const MODERATE_EFFECTIVE_TYPES = new Set(["3g"]);

const SLOW_DOWNLINK_MBPS = 0.5;

const MODERATE_DOWNLINK_MBPS = 1.5;

export const getNavigatorNetworkInformation = ():
  | NetworkInformationLike
  | undefined => {
  if (typeof navigator === "undefined") {
    return undefined;
  }

  const nav = navigator as Navigator & {
    connection?: NetworkInformationLike;
    mozConnection?: NetworkInformationLike;
    webkitConnection?: NetworkInformationLike;
  };

  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
};

export const classifyNetworkConnectionQuality = (
  connection: NetworkInformationLike | undefined,
): PlaybackEmbedConnectionQuality => {
  if (!connection) {
    return "unknown";
  }

  if (connection.saveData === true) {
    return "slow";
  }

  const effectiveType = connection.effectiveType;

  if (effectiveType && SLOW_EFFECTIVE_TYPES.has(effectiveType)) {
    return "slow";
  }

  if (effectiveType && MODERATE_EFFECTIVE_TYPES.has(effectiveType)) {
    return "moderate";
  }

  if (typeof connection.downlink === "number") {
    if (connection.downlink < SLOW_DOWNLINK_MBPS) {
      return "slow";
    }

    if (connection.downlink < MODERATE_DOWNLINK_MBPS) {
      return "moderate";
    }
  }

  if (effectiveType === "4g") {
    return "fast";
  }

  if (effectiveType) {
    return "fast";
  }

  return "unknown";
};

export const resolvePlaybackEmbedUnavailableWatchdogMsForQuality = (
  quality: PlaybackEmbedConnectionQuality,
  isCoarsePointer: boolean,
): number => {
  switch (quality) {
    case "slow":
      return PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_SLOW_MS;
    case "moderate":
      return PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MODERATE_MS;
    case "fast":
      return PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS;
    case "unknown":
      return isCoarsePointer
        ? PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MOBILE_MS
        : PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS;
  }
};

export const resolvePlaybackEmbedUnavailableWatchdogMs = (): number => {
  if (typeof window === "undefined") {
    return PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS;
  }

  const quality = classifyNetworkConnectionQuality(
    getNavigatorNetworkInformation(),
  );
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

  return resolvePlaybackEmbedUnavailableWatchdogMsForQuality(
    quality,
    isCoarsePointer,
  );
};

export const shouldArmPlaybackEmbedStartWatchdog = (
  visibilityState: DocumentVisibilityState,
): boolean => visibilityState !== "hidden";

export const createEmbedPlaybackStartWatchdog = ({
  resolveDelayMs,
  schedule,
  cancel,
}: {
  resolveDelayMs: () => number;
  schedule: (callback: () => void, delayMs: number) => number;
  cancel: (timeoutId: number) => void;
}) => {
  let timeoutId: number | null = null;

  const disarm = () => {
    if (timeoutId === null) {
      return;
    }

    cancel(timeoutId);
    timeoutId = null;
  };

  return {
    arm: (onTimeout: () => void) => {
      disarm();
      timeoutId = schedule(() => {
        timeoutId = null;
        onTimeout();
      }, resolveDelayMs());
    },
    disarm,
  };
};
