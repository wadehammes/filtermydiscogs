import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createQueueItem } from "src/utils/playbackQueue";
import {
  bindRecordTrackEvent,
  creditTrackListenOnEmbedEnded,
  recordTrackPlayFromQueueItem,
  resetRecordTrackEventBinding,
  resetUserTrackRecordingSession,
  tickTrackListenMs,
} from "src/utils/userTrackRecording";

let mockRecordTrackEvent: jest.Mock<(body: unknown) => void>;

beforeEach(() => {
  jest.clearAllMocks();
  resetUserTrackRecordingSession();
  mockRecordTrackEvent = jest.fn();
  bindRecordTrackEvent(mockRecordTrackEvent);
});

afterEach(() => {
  resetRecordTrackEventBinding();
});

describe("userTrackRecording", () => {
  it("records play once per track key until session reset", () => {
    const release = releaseFactory.withDisplayDefaults({ instance_id: "1" });
    const item = createQueueItem({
      release,
      trackPosition: "A",
      trackTitle: "One",
    });

    recordTrackPlayFromQueueItem(item, "dQw4w9WgXcQ");
    recordTrackPlayFromQueueItem(item, "dQw4w9WgXcQ");

    expect(mockRecordTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockRecordTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "play",
        track_key: "1:A",
      }),
    );
  });

  it("records play again after session reset", () => {
    const release = releaseFactory.withDisplayDefaults({ instance_id: "1" });
    const item = createQueueItem({
      release,
      trackPosition: "A",
      trackTitle: "One",
    });

    recordTrackPlayFromQueueItem(item);
    resetUserTrackRecordingSession();
    recordTrackPlayFromQueueItem(item);

    expect(mockRecordTrackEvent).toHaveBeenCalledTimes(2);
  });

  it("credits listen once after listen threshold", () => {
    const release = releaseFactory.withDisplayDefaults({ instance_id: "1" });
    const item = createQueueItem({
      release,
      trackPosition: "A",
      trackTitle: "One",
    });

    recordTrackPlayFromQueueItem(item);
    tickTrackListenMs(item, 29_999);
    tickTrackListenMs(item, 1);

    expect(mockRecordTrackEvent).toHaveBeenCalledTimes(2);
    expect(mockRecordTrackEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({ event: "listen", track_key: "1:A" }),
    );
  });

  it("credits listen on embed ended when threshold not yet reached", () => {
    const release = releaseFactory.withDisplayDefaults({ instance_id: "1" });
    const item = createQueueItem({
      release,
      trackPosition: "A",
      trackTitle: "One",
    });

    recordTrackPlayFromQueueItem(item);
    tickTrackListenMs(item, 5_000);
    creditTrackListenOnEmbedEnded(item);

    expect(mockRecordTrackEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({ event: "listen" }),
    );
  });
});
