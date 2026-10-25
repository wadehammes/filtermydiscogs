import type { DiscogsRelease } from "src/types";

export interface PlaybackQueueItem {
  instanceId: string;
  trackPosition: string;
  trackTitle: string;
  release: DiscogsRelease;
  youtubeVideoId?: string;
  artist?: string | null;
  releaseTitle?: string | null;
  previewVideoUri?: string;
  fromSimilarRelease?: boolean;
}
