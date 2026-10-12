import { ApiFetchError } from "src/api/apiFetchError";

export const ReleaseModalDetailLoadErrorKind = {
  DiscogsOutage: "discogs-outage",
  RateLimited: "rate-limited",
  Generic: "generic",
} as const;

export type ReleaseModalDetailLoadErrorKind =
  (typeof ReleaseModalDetailLoadErrorKind)[keyof typeof ReleaseModalDetailLoadErrorKind];

export type ReleaseModalDetailLoadErrorContent = {
  kind: ReleaseModalDetailLoadErrorKind;
  title: string | null;
  message: string;
};

export const DISCOGS_STATUS_URL = "https://status.discogs.com";

const isDiscogsUpstreamUnavailableError = (error: ApiFetchError): boolean =>
  error.status === 502 || error.status === 503;

export const getReleaseModalDetailLoadErrorContent = (
  error: unknown,
): ReleaseModalDetailLoadErrorContent => {
  if (error instanceof ApiFetchError) {
    if (isDiscogsUpstreamUnavailableError(error)) {
      return {
        kind: ReleaseModalDetailLoadErrorKind.DiscogsOutage,
        title: "Discogs is having trouble right now",
        message:
          "We couldn't load the track listing for this release. Try again in a few minutes.",
      };
    }

    if (error.status === 429) {
      return {
        kind: ReleaseModalDetailLoadErrorKind.RateLimited,
        title: "Discogs rate limit",
        message:
          "Please wait a moment, then try loading the track listing again.",
      };
    }
  }

  return {
    kind: ReleaseModalDetailLoadErrorKind.Generic,
    title: null,
    message: "Could not load track listing for this release.",
  };
};
