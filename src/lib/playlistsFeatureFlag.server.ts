import { playlistsFeature } from "filtermydiscogs-flags";

export const evaluatePlaylistsFeatureFlag = async (): Promise<boolean> =>
  Boolean(await playlistsFeature());
