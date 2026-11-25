import { describe, expect, it } from "@jest/globals";
import { ApiFetchError } from "src/api/apiFetchError";
import {
  COLLECTION_LOAD_ERROR_DISCOGS_STATUS_URL,
  getCollectionLoadErrorContent,
} from "src/utils/collectionLoadError";

describe("getCollectionLoadErrorContent", () => {
  it("maps Discogs upstream errors to outage copy with a status link", () => {
    expect(
      getCollectionLoadErrorContent(new ApiFetchError(502, "Bad gateway")),
    ).toEqual({
      kind: "discogs-outage",
      title: "Discogs is having trouble right now",
      message: "We couldn't load your collection. Try again in a few minutes.",
      showDiscogsStatusLink: true,
      statusUrl: COLLECTION_LOAD_ERROR_DISCOGS_STATUS_URL,
    });
  });

  it("maps rate limits to retry guidance", () => {
    expect(
      getCollectionLoadErrorContent(new ApiFetchError(429, "Too many")),
    ).toMatchObject({
      kind: "rate-limited",
      title: "Discogs rate limit",
      showDiscogsStatusLink: false,
    });
  });

  it("falls back to generic copy for unknown errors", () => {
    expect(getCollectionLoadErrorContent(new Error("network"))).toMatchObject({
      kind: "generic",
      title: "Error loading collection",
      showDiscogsStatusLink: false,
    });
  });
});
