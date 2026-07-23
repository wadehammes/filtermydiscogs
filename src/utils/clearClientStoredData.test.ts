import { beforeEach, describe, expect, it } from "@jest/globals";
import { FILTERS_STORAGE_KEY } from "src/utils/filtersStorage";
import { RELEASE_PLAYBACK_STORAGE_KEY } from "src/utils/releasePlaybackStorage";
import {
  clearClientStoredData,
  SELECTED_RELEASES_STORAGE_KEY,
  THEME_STORAGE_KEY,
  USERNAME_STORAGE_KEY,
  VIEW_STATE_STORAGE_KEY,
} from "./clearClientStoredData";

describe("clearClientStoredData", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("removes all client preference keys from localStorage", () => {
    localStorage.setItem(SELECTED_RELEASES_STORAGE_KEY, "[]");
    localStorage.setItem(USERNAME_STORAGE_KEY, "testuser");
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    localStorage.setItem(VIEW_STATE_STORAGE_KEY, "{}");
    localStorage.setItem(FILTERS_STORAGE_KEY, "{}");
    localStorage.setItem(RELEASE_PLAYBACK_STORAGE_KEY, "{}");

    clearClientStoredData();

    expect(localStorage.getItem(SELECTED_RELEASES_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(USERNAME_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(VIEW_STATE_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(FILTERS_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(RELEASE_PLAYBACK_STORAGE_KEY)).toBeNull();
  });
});
