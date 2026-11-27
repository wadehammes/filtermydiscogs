import { describe, expect, it } from "@jest/globals";
import { ApiFetchError } from "src/api/apiFetchError";
import { COLLECTION_LOAD_ERROR_DISCOGS_STATUS_URL } from "src/utils/collectionLoadError";
import { getDashboardSegmentErrorContent } from "src/utils/getDashboardSegmentErrorContent";

describe("getDashboardSegmentErrorContent", () => {
  it("when Discogs returns 503, includes status link for value", () => {
    expect(
      getDashboardSegmentErrorContent(
        new ApiFetchError(503, "upstream"),
        "collection_value",
      ),
    ).toEqual({
      message: "Estimated value unavailable",
      detail: "We couldn't load your collection. Try again in a few minutes.",
      showDiscogsStatusLink: true,
      statusUrl: COLLECTION_LOAD_ERROR_DISCOGS_STATUS_URL,
    });
  });

  it("when Discogs returns 429, omits status link for top tracks", () => {
    expect(
      getDashboardSegmentErrorContent(new ApiFetchError(429), "top_tracks"),
    ).toEqual({
      message: "Playback stats unavailable",
      detail: "Please wait a moment, then try loading your collection again.",
      showDiscogsStatusLink: false,
      statusUrl: COLLECTION_LOAD_ERROR_DISCOGS_STATUS_URL,
    });
  });
});
