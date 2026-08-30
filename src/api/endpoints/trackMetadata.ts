import { FetchMethods, fetchOptions, fetchResponse } from "src/api/helpers";
import type {
  TrackMetadataBatchRequest,
  TrackMetadataBatchResponse,
} from "src/types/trackMetadata.types";

export const fetchTrackMetadataBatch = async (
  request: TrackMetadataBatchRequest,
): Promise<TrackMetadataBatchResponse> =>
  fetchResponse(
    fetch(
      "/api/track-metadata",
      fetchOptions({
        method: FetchMethods.Post,
        body: JSON.stringify(request),
      }),
    ),
  );
