import { getCollectionLoadErrorContent } from "src/utils/collectionLoadError";

export type DashboardSegmentErrorKey = "collection_value" | "top_tracks";

const SEGMENT_UNAVAILABLE_MESSAGE = {
  collection_value: "Estimated value unavailable",
  top_tracks: "Playback stats unavailable",
} as const satisfies Record<DashboardSegmentErrorKey, string>;

export type DashboardSegmentErrorContent = {
  message: string;
  detail: string;
  showDiscogsStatusLink: boolean;
  statusUrl: string;
};

export const getDashboardSegmentErrorContent = (
  error: unknown,
  segment: DashboardSegmentErrorKey,
): DashboardSegmentErrorContent => {
  const content = getCollectionLoadErrorContent(error);

  return {
    message: SEGMENT_UNAVAILABLE_MESSAGE[segment],
    detail: content.message,
    showDiscogsStatusLink: content.showDiscogsStatusLink,
    statusUrl: content.statusUrl,
  };
};
