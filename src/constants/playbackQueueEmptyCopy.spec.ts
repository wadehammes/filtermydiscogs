import { describe, expect, it } from "@jest/globals";
import {
  PLAYBACK_QUEUE_EMPTY_MESSAGE_DESKTOP,
  PLAYBACK_QUEUE_EMPTY_MESSAGE_TOUCH,
} from "src/constants/playbackQueueEmptyCopy.constants";

describe("playbackQueueEmptyCopy", () => {
  it("uses hover guidance on desktop and tap guidance on touch layouts", () => {
    expect(PLAYBACK_QUEUE_EMPTY_MESSAGE_DESKTOP).toContain("Hover");
    expect(PLAYBACK_QUEUE_EMPTY_MESSAGE_TOUCH).toContain("tap");
    expect(PLAYBACK_QUEUE_EMPTY_MESSAGE_TOUCH).not.toContain("Hover");
  });
});
