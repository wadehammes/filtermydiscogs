import { playlistsFeature } from "../../flags";

export const evaluatePlaylistsFeatureFlag = async (): Promise<boolean> =>
  Boolean(await playlistsFeature());
