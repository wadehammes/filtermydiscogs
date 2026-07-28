import { beforeEach, describe, expect, it } from "@jest/globals";
import { trackEvent } from "src/analytics/analytics";

describe("trackEvent", () => {
  beforeEach(() => {
    window.dataLayer = [];
  });

  it("pushes the event and properties to dataLayer", () => {
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
