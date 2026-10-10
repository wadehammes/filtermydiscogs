import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  trackCrateSyncBlockedFromError,
  trackDiscogsUpstreamRateLimited,
} from "src/analytics/productAnalyticsEvents";
import { ANALYTICS_CONSENT_STORAGE_KEY } from "src/constants/storageKeys";
import { CrateSyncError } from "src/utils/crateSyncError";

describe("productAnalyticsEvents", () => {
  beforeEach(() => {
    window.dataLayer = [];
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "granted");
  });

  it("emits crateSyncBlocked for CrateSyncError 400 with blocked reason", () => {
    trackCrateSyncBlockedFromError(
      new CrateSyncError("Collection too small", 400, "collection_too_small"),
    );

    expect(window.dataLayer).toEqual([
      {
        event: "crateSyncBlocked",
        category: "crate",
        action: "crateSyncBlocked",
        label: "collection_too_small",
        value: "Collection too small",
      },
    ]);
  });

  it("emits crateSyncBlocked with unknown when blockedReason is missing on 400", () => {
    trackCrateSyncBlockedFromError(
      new CrateSyncError("Blocked", 400, undefined),
    );

    expect(window.dataLayer?.[0]).toMatchObject({
      event: "crateSyncBlocked",
      label: "unknown",
      value: "Blocked",
    });
  });

  it("does not emit crateSyncBlocked for non-CrateSyncError failures", () => {
    trackCrateSyncBlockedFromError(new Error("Network error"));

    expect(window.dataLayer).toEqual([]);
  });

  it("does not emit crateSyncBlocked for CrateSyncError with non-400 status", () => {
    trackCrateSyncBlockedFromError(
      new CrateSyncError("Server error", 500, "collection_too_small"),
    );

    expect(window.dataLayer).toEqual([]);
  });

  it("emits discogsRateLimited for collection upstream throttle", () => {
    trackDiscogsUpstreamRateLimited("collection");

    expect(window.dataLayer?.[0]).toMatchObject({
      event: "discogsRateLimited",
      category: "discogs",
      label: "collection",
      value: "429",
    });
  });
});
