import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  collectionViewCookieAttributeSuffix,
  VIEW_COOKIE_MAX_AGE_SECONDS,
} from "src/constants/collectionViewCookie.constants";
import {
  VIEW_STATE_COOKIE_NAME,
  VIEW_STATE_STORAGE_KEY,
} from "src/constants/storageKeys";
import {
  formatCollectionViewCookie,
  parseCollectionViewCookie,
  readInitialCollectionViewMode,
  syncCollectionViewCookie,
} from "src/utils/collectionViewModeStorage";

describe("collectionViewModeStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-collection-view");
  });

  it("reads the current view from the document data attribute", () => {
    document.documentElement.setAttribute("data-collection-view", "list");

    expect(readInitialCollectionViewMode()).toBe("list");
  });

  it("parseCollectionViewCookie accepts view mode cookie values", () => {
    expect(parseCollectionViewCookie("list")).toBe("list");
    expect(parseCollectionViewCookie("nope")).toBeUndefined();
  });

  it("formatCollectionViewCookie includes shared cookie attributes", () => {
    expect(formatCollectionViewCookie("list")).toBe(
      `${VIEW_STATE_COOKIE_NAME}=list${collectionViewCookieAttributeSuffix}`,
    );
    expect(collectionViewCookieAttributeSuffix).toContain(
      String(VIEW_COOKIE_MAX_AGE_SECONDS),
    );
  });

  it("syncCollectionViewCookie writes filtermydiscogs_view", () => {
    syncCollectionViewCookie("list");

    expect(document.cookie).toContain("filtermydiscogs_view=list");
  });

  it("falls back to localStorage when the document attribute is missing", () => {
    localStorage.setItem(
      VIEW_STATE_STORAGE_KEY,
      JSON.stringify({ currentView: "list", previousView: "card" }),
    );

    expect(readInitialCollectionViewMode()).toBe("list");
  });
});
