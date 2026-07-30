import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  LEGACY_COMMUNITY_RATINGS_STORAGE_KEY,
  SELECTED_RELEASES_STORAGE_KEY,
  THEME_STORAGE_KEY,
  USERNAME_STORAGE_KEY,
  VIEW_STATE_STORAGE_KEY,
} from "src/constants/storageKeys";
import { PERSIST_FILTERS_STORAGE_KEY } from "src/utils/filterPersistence";
import { FILTERS_STORAGE_KEY } from "src/utils/filtersStorage";
import { PLAYBACK_VIDEO_INTRO_STORAGE_KEY } from "src/utils/playbackVideoIntroStorage";
import { RELEASE_PLAYBACK_STORAGE_KEY } from "src/utils/releasePlaybackStorage";
import { clearClientStoredData } from "./clearClientStoredData";

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
    localStorage.setItem(PLAYBACK_VIDEO_INTRO_STORAGE_KEY, "true");
    localStorage.setItem(LEGACY_COMMUNITY_RATINGS_STORAGE_KEY, "{}");
    localStorage.setItem(PERSIST_FILTERS_STORAGE_KEY, "false");
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "granted");

    clearClientStoredData();

    expect(localStorage.getItem(SELECTED_RELEASES_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(USERNAME_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(VIEW_STATE_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(FILTERS_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(RELEASE_PLAYBACK_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(PLAYBACK_VIDEO_INTRO_STORAGE_KEY)).toBeNull();
    expect(
      localStorage.getItem(LEGACY_COMMUNITY_RATINGS_STORAGE_KEY),
    ).toBeNull();
    expect(localStorage.getItem(PERSIST_FILTERS_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBeNull();
  });
});
