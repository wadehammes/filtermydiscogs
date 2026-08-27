import { beforeEach, describe, expect, it } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createQueueItem } from "src/utils/playbackQueue";
import {
  clearPersistedReleasePlayback,
  readPersistedReleasePlayback,
  toPersistedQueueItem,
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

  it("writes and reads the upcoming queue", () => {
    const release = releaseFactory.build();
    const queueItem = createQueueItem({
      release,
      trackPosition: "B1",
      trackTitle: "Track B1",
    });

    writePersistedReleasePlayback({
      instanceId: "instance-123",
      trackPosition: "A2",
      queue: [toPersistedQueueItem(queueItem)],
    });

    expect(readPersistedReleasePlayback()).toEqual({
      instanceId: "instance-123",
      trackPosition: "A2",
      queue: [
        {
          instanceId: String(release.instance_id),
          trackPosition: "B1",
          trackTitle: "Track B1",
        },
      ],
    });
  });

  it("returns null for invalid stored payloads", () => {
    localStorage.setItem("filtermydiscogs_release_playback", "{ invalid");

    expect(readPersistedReleasePlayback()).toBeNull();
  });

  it("returns null for invalid queue entries", () => {
    localStorage.setItem(
      "filtermydiscogs_release_playback",
      JSON.stringify({
        instanceId: "instance-123",
        trackPosition: "A2",
        queue: [{ instanceId: "bad" }],
      }),
    );

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
