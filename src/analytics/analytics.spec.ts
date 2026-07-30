import { beforeEach, describe, expect, it } from "@jest/globals";
import { trackEvent } from "src/analytics/analytics";
import { ANALYTICS_CONSENT_STORAGE_KEY } from "src/constants/storageKeys";

describe("trackEvent", () => {
  beforeEach(() => {
    window.dataLayer = [];
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "granted");
  });

  it("pushes the event and properties to dataLayer when consent is granted", () => {
    trackEvent("stylePillClicked", {
      category: "releaseListItem",
      action: "stylePillClicked",
      label: "Style Pill Clicked",
      value: "Rock",
    });

    expect(window.dataLayer).toEqual([
      {
        event: "stylePillClicked",
        category: "releaseListItem",
        action: "stylePillClicked",
        label: "Style Pill Clicked",
        value: "Rock",
      },
    ]);
  });

  it("does not push events when consent is denied", () => {
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "denied");

    trackEvent("stylePillClicked", {
      category: "releaseListItem",
      action: "stylePillClicked",
      label: "Style Pill Clicked",
      value: "Rock",
    });

    expect(window.dataLayer).toEqual([]);
  });

  it("initializes dataLayer when it is missing", () => {
    Reflect.deleteProperty(window, "dataLayer");

    trackEvent("pageView", {
      category: "navigation",
      action: "pageView",
      label: "Home",
      value: "/",
    });

    expect(window.dataLayer).toEqual([
      {
        event: "pageView",
        category: "navigation",
        action: "pageView",
        label: "Home",
        value: "/",
      },
    ]);
  });
});
