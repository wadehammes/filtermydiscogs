import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  clearPersistedReleasePlayback,
  RELEASE_PLAYBACK_STORAGE_KEY,
  readPersistedReleasePlayback,
  writePersistedReleasePlayback,
} from "src/utils/releasePlaybackStorage";

describe("releasePlaybackStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("writes and reads persisted playback state", () => {
    writePersistedReleasePlayback({
      instanceId: "instance-123",
      trackPosition: "A2",
    });

    expect(readPersistedReleasePlayback()).toEqual({
      instanceId: "instance-123",
      trackPosition: "A2",
    });
  });

  it("returns null for invalid stored payloads", () => {
    localStorage.setItem(RELEASE_PLAYBACK_STORAGE_KEY, "{ invalid");

    expect(readPersistedReleasePlayback()).toBeNull();
  });

  it("clears persisted playback state", () => {
    writePersistedReleasePlayback({
      instanceId: "instance-123",
      trackPosition: "A2",
    });

    clearPersistedReleasePlayback();

    expect(readPersistedReleasePlayback()).toBeNull();
  });
});
