import { describe, expect, it } from "@jest/globals";
import type { ErrorEvent } from "@sentry/core";
import { normalizeSentryErrorEvent } from "src/lib/sentry/sentryBeforeSendEvent";

const buildPlaybackSkipEvent = (): ErrorEvent => {
  const event = {
    type: "error",
    message:
      "Embed Load Watchdog - Private, removed, blocked, or still loading - yt:abc",
    tags: {
      "playback.skip_source": "watchdog",
    },
    extra: {
      reason: "Private, removed, blocked, or still loading",
    },
    exception: {
      values: [
        {
          type: "Error",
          value: null,
          stacktrace: {
            frames: [{ filename: "Module.T", function: "Module.T" }],
          },
        },
      ],
    },
  } as unknown as ErrorEvent;

  return event;
};

describe("normalizeSentryErrorEvent", () => {
  it("groups playback skip messages by source and reason without SDK stack frames", () => {
    const event = buildPlaybackSkipEvent();

    const normalized = normalizeSentryErrorEvent(event);

    expect(normalized?.fingerprint).toEqual([
      "playback-skip",
      "watchdog",
      "Private, removed, blocked, or still loading",
    ]);
    expect(normalized?.exception).toBeUndefined();
  });

  it("returns the event unchanged when it is not a playback skip report", () => {
    const event = {
      message: "Unhandled API failure",
    } as ErrorEvent;

    const normalized = normalizeSentryErrorEvent(event);

    expect(normalized).toBe(event);
    expect(normalized?.fingerprint).toBeUndefined();
  });
});
