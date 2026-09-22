import { describe, expect, it, jest } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createQueueItem } from "src/utils/playbackQueue";
import { createPlaybackEndedAdvanceHandler } from "src/utils/releasePlaybackEndedAdvance";

const queueRow = () =>
  createQueueItem({
    release: releaseFactory.build(),
    trackPosition: "A",
    trackTitle: "A",
  });

describe("releasePlaybackEndedAdvance", () => {
  it("does nothing when playback is not active", () => {
    const playNext = jest.fn();
    const extendQueueTail = jest.fn(async () => true);

    const handler = createPlaybackEndedAdvanceHandler({
      isPlayingRef: { current: false },
      queueRef: { current: [queueRow()] },
      extendQueueTailRef: { current: extendQueueTail },
      playNextRef: { current: playNext },
    });

    handler();

    expect(extendQueueTail).not.toHaveBeenCalled();
    expect(playNext).not.toHaveBeenCalled();
  });

  it("advances on ended even when transport is paused (background PAUSE before ENDED)", () => {
    const playNext = jest.fn();

    const handler = createPlaybackEndedAdvanceHandler({
      isPlayingRef: { current: true },
      queueRef: { current: [queueRow()] },
      extendQueueTailRef: { current: jest.fn(async () => true) },
      playNextRef: { current: playNext },
    });

    handler();

    expect(playNext).toHaveBeenCalledTimes(1);
  });

  it("advances immediately when upcoming has rows", () => {
    const playNext = jest.fn();
    const extendQueueTail = jest.fn(async () => true);

    const handler = createPlaybackEndedAdvanceHandler({
      isPlayingRef: { current: true },
      queueRef: { current: [queueRow()] },
      extendQueueTailRef: { current: extendQueueTail },
      playNextRef: { current: playNext },
    });

    handler();

    expect(playNext).toHaveBeenCalledTimes(1);
    expect(extendQueueTail).not.toHaveBeenCalled();
  });

  it("extends the tail before advancing when upcoming is empty", async () => {
    const playNext = jest.fn();
    const queueRef = { current: [] as ReturnType<typeof queueRow>[] };
    const extendQueueTail = jest.fn(async () => {
      queueRef.current = [
        createQueueItem({
          release: releaseFactory.build(),
          trackPosition: "B",
          trackTitle: "B",
        }),
      ];
      return true;
    });

    const handler = createPlaybackEndedAdvanceHandler({
      isPlayingRef: { current: true },
      queueRef,
      extendQueueTailRef: { current: extendQueueTail },
      playNextRef: { current: playNext },
    });

    handler();

    await Promise.resolve();

    expect(extendQueueTail).toHaveBeenCalledTimes(1);
    expect(playNext).toHaveBeenCalledTimes(1);
  });

  it("skips advance when tail extension does not add tracks", async () => {
    const playNext = jest.fn();

    const handler = createPlaybackEndedAdvanceHandler({
      isPlayingRef: { current: true },
      queueRef: { current: [] },
      extendQueueTailRef: { current: jest.fn(async () => false) },
      playNextRef: { current: playNext },
    });

    handler();

    await Promise.resolve();

    expect(playNext).not.toHaveBeenCalled();
  });
});
