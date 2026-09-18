export const EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS = 400;

export const shouldAcceptEmbedPlayingConfirmation = ({
  embedLoadStartedAtMs,
  nowMs,
  minDelayMs = EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
}: {
  embedLoadStartedAtMs: number | null;
  nowMs: number;
  minDelayMs?: number;
}): boolean => {
  if (embedLoadStartedAtMs === null) {
    return false;
  }

  return nowMs - embedLoadStartedAtMs >= minDelayMs;
};
