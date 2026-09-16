import type { DiscogsRelease, DiscogsVideo } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import {
  getSessionRelease,
  type PlaybackSessionState,
  selectIsPaused,
  selectIsPlaying,
} from "src/utils/playbackSessionState";

export interface PlaybackSessionRefTarget {
  release: { current: DiscogsRelease | null };
  queue: { current: PlaybackQueueItem[] };
  playbackHistory: { current: PlaybackQueueItem[] };
  activeTrackIndex: { current: number };
  previewVideo: { current: DiscogsVideo | null };
  isPlaying: { current: boolean };
  isPaused: { current: boolean };
}

export const syncPlaybackSessionRefs = (
  session: PlaybackSessionState,
  targets: PlaybackSessionRefTarget,
): void => {
  targets.release.current = getSessionRelease(session);
  targets.queue.current = session.queue;
  targets.playbackHistory.current = session.playbackHistory;
  targets.activeTrackIndex.current = session.activeTrackIndex;
  targets.previewVideo.current =
    session.kind === "idle" ? null : session.previewVideo;
  targets.isPlaying.current = selectIsPlaying(session);
  targets.isPaused.current = selectIsPaused(session);
};
