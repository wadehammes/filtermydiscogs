import { describe, expect, it, jest } from "@jest/globals";
import {
  createPlaybackEmbedUnavailableSkipHandler,
  PLAYBACK_EMBED_UNAVAILABLE_FALLBACK,
} from "src/utils/playbackEmbedUnavailableSkip";

describe("createPlaybackEmbedUnavailableSkipHandler", () => {
  it("appends skip toast once per track while failures are in flight", () => {
    const appendSkip = jest.fn();
    const playNext = jest.fn();
    const resolveSkipDisplay = jest.fn(() => ({
      trackLabel: "A1 Track - Artist, Album",
    }));

    const handler = createPlaybackEmbedUnavailableSkipHandler({
      appendSkip,
      resolveSkipDisplay,
      isSkipAllowed: () => true,
    });

    handler.handleFailure(100, playNext);
    handler.handleFailure(PLAYBACK_EMBED_UNAVAILABLE_FALLBACK, playNext);

    expect(appendSkip).toHaveBeenCalledTimes(1);
    expect(appendSkip.mock.calls[0]?.[0]).toEqual({
      trackLabel: "A1 Track - Artist, Album",
      reason: "Private or removed on YouTube",
    });

    const onSkip = appendSkip.mock.calls[0]?.[1] as (() => void) | undefined;
    onSkip?.();
    expect(playNext).toHaveBeenCalledTimes(1);
  });

  it("does not append skip when there is no active playback session", () => {
    const appendSkip = jest.fn();
    const playNext = jest.fn();

    const handler = createPlaybackEmbedUnavailableSkipHandler({
      appendSkip,
      resolveSkipDisplay: () => ({ trackLabel: "A1 Track - Artist, Album" }),
      isSkipAllowed: () => false,
    });

    handler.handleFailure(100, playNext);

    expect(appendSkip).not.toHaveBeenCalled();
    expect(playNext).not.toHaveBeenCalled();
  });

  it("appends skip when transport is paused but the playback session is still active", () => {
    const appendSkip = jest.fn();
    const playNext = jest.fn();

    const handler = createPlaybackEmbedUnavailableSkipHandler({
      appendSkip,
      resolveSkipDisplay: () => ({ trackLabel: "A1 Track" }),
      isSkipAllowed: () => true,
    });

    handler.handleFailure(100, playNext);

    expect(appendSkip).toHaveBeenCalledTimes(1);
  });

  it("reports skip to monitoring before showing the toast", () => {
    const appendSkip = jest.fn();
    const reportSkip = jest.fn();
    const playNext = jest.fn();

    const handler = createPlaybackEmbedUnavailableSkipHandler({
      appendSkip,
      reportSkip,
      resolveSkipDisplay: () => ({ trackLabel: "A1 Track" }),
      resolveSkipContext: () => ({
        youtubeVideoId: "yt123",
        watchdogMs: 5000,
        connectionQuality: "fast",
      }),
      isSkipAllowed: () => true,
    });

    handler.handleFailure(101, playNext);

    expect(reportSkip).toHaveBeenCalledWith({
      errorCode: 101,
      trackLabel: "A1 Track",
      reason: "Cannot play in embedded player",
      context: {
        youtubeVideoId: "yt123",
        watchdogMs: 5000,
        connectionQuality: "fast",
      },
    });
    expect(appendSkip).toHaveBeenCalledTimes(1);
  });

  it("uses fallback copy when onError never arrives", () => {
    const appendSkip = jest.fn();
    const playNext = jest.fn();

    const handler = createPlaybackEmbedUnavailableSkipHandler({
      appendSkip,
      resolveSkipDisplay: () => ({
        trackLabel: "A1 Track - Artist, Album",
      }),
      isSkipAllowed: () => true,
    });

    handler.handleFailure(PLAYBACK_EMBED_UNAVAILABLE_FALLBACK, playNext);

    expect(appendSkip).toHaveBeenCalledTimes(1);
    expect(appendSkip.mock.calls[0]?.[0]).toEqual({
      trackLabel: "A1 Track - Artist, Album",
      reason: "Private, removed, blocked, or still loading",
    });
  });
});
