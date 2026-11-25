import { ApiFetchError } from "src/api/apiFetchError";

export const COLLECTION_LOAD_ERROR_DISCOGS_STATUS_URL =
  "https://status.discogs.com";

export const CollectionLoadErrorKind = {
  DiscogsOutage: "discogs-outage",
  RateLimited: "rate-limited",
  Generic: "generic",
} as const;

export type CollectionLoadErrorKind =
  (typeof CollectionLoadErrorKind)[keyof typeof CollectionLoadErrorKind];

export type CollectionLoadErrorContent = {
  kind: CollectionLoadErrorKind;
  title: string;
  message: string;
  showDiscogsStatusLink: boolean;
  statusUrl: typeof COLLECTION_LOAD_ERROR_DISCOGS_STATUS_URL;
};

const isDiscogsUpstreamUnavailableError = (error: ApiFetchError): boolean =>
  error.status === 502 || error.status === 503;

export const getCollectionLoadErrorContent = (
  error: unknown,
): CollectionLoadErrorContent => {
  if (error instanceof ApiFetchError) {
    if (isDiscogsUpstreamUnavailableError(error)) {
      return {
        kind: CollectionLoadErrorKind.DiscogsOutage,
        title: "Discogs is having trouble right now",
        message:
          "We couldn't load your collection. Try again in a few minutes.",
        showDiscogsStatusLink: true,
        statusUrl: COLLECTION_LOAD_ERROR_DISCOGS_STATUS_URL,
      };
    }

    if (error.status === 429) {
      return {
        kind: CollectionLoadErrorKind.RateLimited,
        title: "Discogs rate limit",
        message:
          "Please wait a moment, then try loading your collection again.",
        showDiscogsStatusLink: false,
        statusUrl: COLLECTION_LOAD_ERROR_DISCOGS_STATUS_URL,
      };
    }
  }

  return {
    kind: CollectionLoadErrorKind.Generic,
    title: "Error loading collection",
    message:
      error instanceof Error && error.message.trim().length > 0
        ? error.message
        : "Something went wrong while loading your collection.",
    showDiscogsStatusLink: false,
    statusUrl: COLLECTION_LOAD_ERROR_DISCOGS_STATUS_URL,
  };
};
