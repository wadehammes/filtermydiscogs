import { describe, expect, it } from "@jest/globals";
import { ApiFetchError } from "src/api/apiFetchError";
import {
  getReleaseModalDetailLoadErrorContent,
  ReleaseModalDetailLoadErrorKind,
} from "src/components/ReleaseModal/releaseModalDetailLoadError";
import { DISCOGS_UPSTREAM_UNAVAILABLE_MESSAGE } from "src/lib/discogs-api-error";

describe("getReleaseModalDetailLoadErrorContent", () => {
  it("returns discogs-outage content for ApiFetchError status 502", () => {
    expect(
      getReleaseModalDetailLoadErrorContent(
        new ApiFetchError(502, DISCOGS_UPSTREAM_UNAVAILABLE_MESSAGE),
      ),
    ).toEqual({
      kind: ReleaseModalDetailLoadErrorKind.DiscogsOutage,
      title: "Discogs is having trouble right now",
      message:
        "We couldn't load the track listing for this release. Try again in a few minutes.",
    });
  });

  it("returns discogs-outage content for ApiFetchError status 503", () => {
    expect(
      getReleaseModalDetailLoadErrorContent(
        new ApiFetchError(503, "Service unavailable"),
      ).kind,
    ).toBe(ReleaseModalDetailLoadErrorKind.DiscogsOutage);
  });

  it("returns rate-limit content for ApiFetchError status 429", () => {
    expect(
      getReleaseModalDetailLoadErrorContent(
        new ApiFetchError(429, "Rate limited", 60_000),
      ),
    ).toEqual({
      kind: ReleaseModalDetailLoadErrorKind.RateLimited,
      title: "Discogs rate limit",
      message:
        "Please wait a moment, then try loading the track listing again.",
    });
  });

  it("returns generic content for other errors", () => {
    expect(getReleaseModalDetailLoadErrorContent(new Error("network"))).toEqual(
      {
        kind: ReleaseModalDetailLoadErrorKind.Generic,
        title: null,
        message: "Could not load track listing for this release.",
      },
    );
  });
});
