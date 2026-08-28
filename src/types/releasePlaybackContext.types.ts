import type { DiscogsRelease, DiscogsTrack, DiscogsVideo } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";

export interface StartPlaybackParams {
  release: DiscogsRelease;
  trackPosition: string;
  trackTitle?: string;
  startPaused?: boolean;
  rebuildAlbumQueue?: boolean;
  youtubeVideoId?: string;
}

export interface StartReleasePreviewParams {
  release: DiscogsRelease;
  video: DiscogsVideo;
}

export interface AddToQueueParams {
  release: DiscogsRelease;
  trackPosition: string;
  trackTitle: string;
}

export interface AddPreviewToQueueParams {
  release: DiscogsRelease;
  video: DiscogsVideo;
}

export interface ReleasePlaybackState {
  release: DiscogsRelease | null;
  tracks: DiscogsTrack[];
  videos: DiscogsVideo[];
  queue: PlaybackQueueItem[];
  autoPlayOnQueueAdd: boolean;
  activeTrackIndex: number;
  activeTrackPosition: string | null;
  activeTrack: DiscogsTrack | null;
  activeVideoId: string | null;
  embedVideoId: string | null;
  playbackVideoId: string | null;
  activePlaybackTitle: string | null;
  isReleasePreview: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  isMiniPlayerVisible: boolean;
  shouldAutoplayEmbed: boolean;
  isPlaybackReady: boolean;
  canPlayPrevious: boolean;
  canPlayNext: boolean;
  isLoading: boolean;
}

export interface ReleasePlaybackActions {
  startPlayback: (params: StartPlaybackParams) => void;
  startReleasePreview: (params: StartReleasePreviewParams) => void;
  addToQueue: (params: AddToQueueParams) => void;
  addPreviewToQueue: (params: AddPreviewToQueueParams) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  playQueueAtIndex: (index: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayback: () => void;
  registerPlaybackIframe: (iframe: HTMLIFrameElement | null) => void;
  notifyPlaybackIframeLoaded: () => void;
  resumePlaybackFromGesture: () => void;
  clearQueue: () => void;
  stopPlayback: () => void;
}

export type ReleasePlaybackContextValue = ReleasePlaybackState &
  ReleasePlaybackActions;
