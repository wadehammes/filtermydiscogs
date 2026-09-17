export const shouldNotifyEmbedPlaybackEnded = ({
  lastEndedAtMs,
  nowMs,
  debounceMs,
}: {
  lastEndedAtMs: number;
  nowMs: number;
  debounceMs: number;
}): boolean => {
  if (lastEndedAtMs <= 0) {
    return true;
  }

  return nowMs - lastEndedAtMs >= debounceMs;
};

export const nextEmbedTrackSwitchGraceUntil = ({
  nowMs,
  graceMs,
}: {
  nowMs: number;
  graceMs: number;
}): number => nowMs + graceMs;

export const isWithinEmbedTrackSwitchGrace = (
  graceUntilMs: number,
  nowMs: number,
): boolean => nowMs < graceUntilMs;
