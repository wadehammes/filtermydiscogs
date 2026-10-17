import {
  type PlaybackEmbedSessionEvent,
  type PlaybackEmbedSessionState,
  reducePlaybackEmbedSession,
} from "src/utils/playbackEmbedSession";
import {
  type PlaybackEmbedSessionRefTarget,
  syncPlaybackEmbedSessionRefs,
} from "src/utils/syncPlaybackEmbedSessionRefs";

export const applyPlaybackEmbedSessionEvent = (
  sessionRef: { current: PlaybackEmbedSessionState },
  event: PlaybackEmbedSessionEvent,
  refTargets: PlaybackEmbedSessionRefTarget,
): PlaybackEmbedSessionState => {
  const next = reducePlaybackEmbedSession(sessionRef.current, event);
  sessionRef.current = next;
  syncPlaybackEmbedSessionRefs(next, refTargets);
  return next;
};
