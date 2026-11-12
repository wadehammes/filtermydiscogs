import { beforeEach, describe, expect, it } from "@jest/globals";
import { VIEW_STATE_STORAGE_KEY } from "src/constants/storageKeys";
import {
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
