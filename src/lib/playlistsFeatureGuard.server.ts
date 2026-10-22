import { getPlaylistsFeatureEnabled } from "src/lib/playlistsFeature.server";
import { privateRouteJson } from "src/lib/private-route-response";

export const playlistsFeatureDisabledResponse = () =>
  privateRouteJson({ error: "Not found" }, { status: 404 });

export const requirePlaylistsFeatureEnabled =
  async (): Promise<Response | null> => {
    if (await getPlaylistsFeatureEnabled()) {
      return null;
    }

    return playlistsFeatureDisabledResponse();
  };
