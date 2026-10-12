import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { playbackSkipLogEntryFactory } from "src/tests/factories/PlaybackSkipLogEntry.factory";
import {
  completePlaybackSkipUserReport,
  openPlaybackSkipReportDialog,
  registerPlaybackSkipReportDialogOpen,
  registerPlaybackSkipUserReportComplete,
} from "src/utils/playbackSkipUserReportDialogBridge";

describe("playbackSkipUserReportDialogBridge", () => {
  let unregisterOpen: (() => void) | undefined;
  let unregisterComplete: (() => void) | undefined;

  afterEach(() => {
    unregisterOpen?.();
    unregisterComplete?.();
    unregisterOpen = undefined;
    unregisterComplete = undefined;
  });

  it("when open handler is registered, forwards the skip log entry", () => {
    const onOpen = jest.fn();
    unregisterOpen = registerPlaybackSkipReportDialogOpen(onOpen);

    const entry = playbackSkipLogEntryFactory.embedDisabledReport({
      trackLabel: "A1 Track",
      context: undefined,
    });

    openPlaybackSkipReportDialog(entry);

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith(entry);
  });

  it("when complete handler is registered, forwards entry and form values", () => {
    const onComplete = jest.fn();
    unregisterComplete = registerPlaybackSkipUserReportComplete(onComplete);

    const entry = playbackSkipLogEntryFactory.embedDisabledReport({
      trackLabel: "A1 Track",
      context: undefined,
    });
    const report = { category: "wrong_video" as const, note: "Bad match" };

    completePlaybackSkipUserReport(entry, report);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(entry, report);
  });

  it("when handlers are not registered, open and complete are no-ops", () => {
    expect(() => {
      openPlaybackSkipReportDialog(
        playbackSkipLogEntryFactory.build({
          errorCode: 100,
          trackLabel: "Track",
          reason: "Private or removed",
          context: undefined,
        }),
      );
      completePlaybackSkipUserReport(
        playbackSkipLogEntryFactory.build({
          errorCode: 100,
          trackLabel: "Track",
          reason: "Private or removed",
          context: undefined,
        }),
        { category: "other" },
      );
    }).not.toThrow();
  });
});
