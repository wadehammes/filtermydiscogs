import { describe, expect, it, jest } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createQueueItem } from "src/utils/playbackQueue";
import {
  createPlaybackEndedAdvanceHandler,
  shouldAdvancePlaybackOnEmbedEnded,
} from "src/utils/releasePlaybackEndedAdvance";

const queueRow = () =>
  createQueueItem({
    release: releaseFactory.build(),
    trackPosition: "A",
    trackTitle: "A",
  });

describe("releasePlaybackEndedAdvance", () => {
  it("shouldAdvancePlaybackOnEmbedEnded is false when transport is paused on a visible tab", () => {
    expect(
      shouldAdvancePlaybackOnEmbedEnded({
        isPlaying: true,
        isPaused: true,
        documentVisibilityState: "visible",
      }),
    ).toBe(false);
  });

  it("shouldAdvancePlaybackOnEmbedEnded is true when transport is paused in a hidden tab", () => {
    expect(
      shouldAdvancePlaybackOnEmbedEnded({
        isPlaying: true,
        isPaused: true,
        documentVisibilityState: "hidden",
      }),
    ).toBe(true);
  });

  it("does nothing when playback is not active", () => {
    const playNext = jest.fn();
    const extendQueueTail = jest.fn(async () => true);

    const handler = createPlaybackEndedAdvanceHandler({
      isPlayingRef: { current: false },
      isPausedRef: { current: false },
      queueRef: { current: [queueRow()] },
      extendQueueTailRef: { current: extendQueueTail },
      playNextRef: { current: playNext },
    });

    handler();

    expect(extendQueueTail).not.toHaveBeenCalled();
    expect(playNext).not.toHaveBeenCalled();
  });

  it("advances on ended when transport is paused in a hidden tab (background PAUSE before ENDED)", () => {
    const playNext = jest.fn();
    const visibilityDescriptor = Object.getOwnPropertyDescriptor(
      document,
      "visibilityState",
    );

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });

    const handler = createPlaybackEndedAdvanceHandler({
      isPlayingRef: { current: true },
      isPausedRef: { current: true },
      queueRef: { current: [queueRow()] },
      extendQueueTailRef: { current: jest.fn(async () => true) },
      playNextRef: { current: playNext },
    });

    handler();

    expect(playNext).toHaveBeenCalledTimes(1);

    if (visibilityDescriptor) {
      Object.defineProperty(document, "visibilityState", visibilityDescriptor);
    }
  });

  it("does not advance on ended when the listener paused on a visible tab", () => {
    const playNext = jest.fn();
    const visibilityDescriptor = Object.getOwnPropertyDescriptor(
      document,
      "visibilityState",
    );

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });

    const handler = createPlaybackEndedAdvanceHandler({
      isPlayingRef: { current: true },
      isPausedRef: { current: true },
      queueRef: { current: [queueRow()] },
      extendQueueTailRef: { current: jest.fn(async () => true) },
      playNextRef: { current: playNext },
    });

    handler();

    expect(playNext).not.toHaveBeenCalled();

    if (visibilityDescriptor) {
      Object.defineProperty(document, "visibilityState", visibilityDescriptor);
    }
  });

  it("advances immediately when upcoming has rows", () => {
    const playNext = jest.fn();
    const extendQueueTail = jest.fn(async () => true);

    const handler = createPlaybackEndedAdvanceHandler({
      isPlayingRef: { current: true },
      isPausedRef: { current: false },
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
      isPausedRef: { current: false },
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
      isPausedRef: { current: false },
      queueRef: { current: [] },
      extendQueueTailRef: { current: jest.fn(async () => false) },
      playNextRef: { current: playNext },
    });

    handler();

    await Promise.resolve();

    expect(playNext).not.toHaveBeenCalled();
  });
});
