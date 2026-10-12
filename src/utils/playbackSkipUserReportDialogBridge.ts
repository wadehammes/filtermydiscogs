import type { PlaybackSkipUserReportFormValues } from "src/lib/validation/playbackSkipUserReport.schemas";
import type { PlaybackSkipLogEntry } from "src/utils/playbackSkippedTrackLog";

type OpenPlaybackSkipReportDialog = (entry: PlaybackSkipLogEntry) => void;

type CompletePlaybackSkipUserReport = (
  entry: PlaybackSkipLogEntry,
  report: PlaybackSkipUserReportFormValues,
) => void;

let openPlaybackSkipReportDialogImpl: OpenPlaybackSkipReportDialog | null =
  null;

let completePlaybackSkipUserReportImpl: CompletePlaybackSkipUserReport | null =
  null;

export const registerPlaybackSkipReportDialogOpen = (
  onOpen: OpenPlaybackSkipReportDialog,
) => {
  openPlaybackSkipReportDialogImpl = onOpen;

  return () => {
    openPlaybackSkipReportDialogImpl = null;
  };
};

export const registerPlaybackSkipUserReportComplete = (
  onComplete: CompletePlaybackSkipUserReport,
) => {
  completePlaybackSkipUserReportImpl = onComplete;

  return () => {
    completePlaybackSkipUserReportImpl = null;
  };
};

export const openPlaybackSkipReportDialog = (
  entry: PlaybackSkipLogEntry,
): void => {
  openPlaybackSkipReportDialogImpl?.(entry);
};

export const completePlaybackSkipUserReport = (
  entry: PlaybackSkipLogEntry,
  report: PlaybackSkipUserReportFormValues,
): void => {
  completePlaybackSkipUserReportImpl?.(entry, report);
};
