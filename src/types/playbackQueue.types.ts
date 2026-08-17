import type { DiscogsRelease } from "src/types";

export interface PlaybackQueueItem {
  instanceId: string;
  trackPosition: string;
  trackTitle: string;
  release: DiscogsRelease;
  previewVideoUri?: string;
}
