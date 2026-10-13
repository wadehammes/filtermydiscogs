"use client";

import classNames from "classnames";
import type { ReactNode } from "react";
import { PlaybackSkipHelpToastTrigger } from "src/components/PlaybackSkipHelpDialog/PlaybackSkipHelpDialog.component";
import { reportUserPlaybackSkipToSentry } from "src/lib/sentry/reportPlaybackSkip";
import type { PlaybackSkipUserReportFormValues } from "src/lib/validation/playbackSkipUserReport.schemas";
import textActionStyles from "src/styles/modules/text-action.module.css";
import { definedProps } from "src/utils/definedProps";
import { showPersistentQueueAreaErrorToast } from "src/utils/playbackQueueToast";
import {
  formatPlaybackSkipLogTitle,
  type PlaybackSkipLogEntry,
  playbackSkipLogEntryKey,
} from "src/utils/playbackSkippedTrackLog";
import {
  openPlaybackSkipReportDialog,
  registerPlaybackSkipUserReportComplete,
} from "src/utils/playbackSkipUserReportDialogBridge";
import { toast } from "src/utils/toast";

export const PLAYBACK_SKIPPED_TRACKS_TOAST_ID = "playback-skipped-tracks";

export const PLAYBACK_SKIP_USER_REPORT_TITLE =
  "Send this skip to error monitoring so we can investigate.";

export const PLAYBACK_SKIP_USER_REPORT_SENT_TITLE = "Report already sent.";

export const resolvePlaybackSkipLogSingleEntry = (
  entries: readonly PlaybackSkipLogEntry[],
): PlaybackSkipLogEntry | null => {
  if (entries.length !== 1) {
    return null;
  }

  const [entry] = entries;

  return entry === undefined ? null : entry;
};

const PlaybackSkipLogEntryContent = ({
  entry,
  onUserReport,
}: {
  entry: PlaybackSkipLogEntry;
  onUserReport: (entry: PlaybackSkipLogEntry) => void;
}) => {
  return (
    <div className="fmd-playback-skip-log-entry">
      <span className="fmd-playback-skip-log-track">{entry.trackLabel}</span>
      <div className="fmd-playback-skip-log-reason-row">
        <span className="fmd-playback-skip-log-reason">{entry.reason}</span>
        <button
          className={classNames(
            textActionStyles.base,
            "fmd-playback-skip-log-report",
          )}
          disabled={entry.userReportSent}
          onClick={() => {
            onUserReport(entry);
          }}
          title={
            entry.userReportSent
              ? PLAYBACK_SKIP_USER_REPORT_SENT_TITLE
              : PLAYBACK_SKIP_USER_REPORT_TITLE
          }
          type="button"
          {...definedProps({
            "aria-label": entry.userReportSent
              ? undefined
              : "Report skip error",
          })}
        >
          {entry.userReportSent ? "Sent" : "Report"}
        </button>
      </div>
    </div>
  );
};

const formatSkipLogDescription = (
  entries: PlaybackSkipLogEntry[],
  onUserReport: (entry: PlaybackSkipLogEntry) => void,
): ReactNode => {
  const singleEntry = resolvePlaybackSkipLogSingleEntry(entries);

  if (singleEntry !== null) {
    return (
      <div className="fmd-playback-skip-log">
        <div className="fmd-playback-skip-log-single">
          <PlaybackSkipLogEntryContent
            entry={singleEntry}
            onUserReport={onUserReport}
          />
        </div>
      </div>
    );
  }

  if (entries.length <= 1) {
    return null;
  }

  return (
    <div className="fmd-playback-skip-log">
      <ul className="fmd-playback-skip-log-list">
        {entries.map((entry, index) => (
          <li
            key={`${playbackSkipLogEntryKey(entry)}#${index}`}
            className="fmd-playback-skip-log-item"
          >
            <PlaybackSkipLogEntryContent
              entry={entry}
              onUserReport={onUserReport}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

type ShowToastParams = {
  title: string;
  description: ReactNode;
  onClose: () => void;
};

const defaultSubmitSkipUserReport = (
  entry: PlaybackSkipLogEntry,
  userReport: PlaybackSkipUserReportFormValues,
) => {
  reportUserPlaybackSkipToSentry(
    definedProps({
      errorCode: entry.errorCode,
      trackLabel: entry.trackLabel,
      reason: entry.reason,
      context: entry.context,
    }),
    userReport,
  );
};

const defaultRequestSkipUserReport = (entry: PlaybackSkipLogEntry) => {
  openPlaybackSkipReportDialog(entry);
};

export const createPlaybackSkipLogToast = ({
  showToast,
  dismissToast,
  submitSkipUserReport = defaultSubmitSkipUserReport,
  requestSkipUserReport = defaultRequestSkipUserReport,
}: {
  showToast: (params: ShowToastParams) => void;
  dismissToast: (id: string) => void;
  submitSkipUserReport?: (
    entry: PlaybackSkipLogEntry,
    userReport: PlaybackSkipUserReportFormValues,
  ) => void;
  requestSkipUserReport?: (entry: PlaybackSkipLogEntry) => void;
}) => {
  let entries: PlaybackSkipLogEntry[] = [];
  let lastOnClose: () => void = () => undefined;

  const refreshToast = (onClose: () => void) => {
    lastOnClose = onClose;
    showToast({
      title: formatPlaybackSkipLogTitle(entries.length),
      description: formatSkipLogDescription(entries, requestSkipUserReport),
      onClose,
    });
  };

  const completeUserReport = (
    reportedEntry: PlaybackSkipLogEntry,
    userReport: PlaybackSkipUserReportFormValues,
  ) => {
    submitSkipUserReport(reportedEntry, userReport);
    const reportedKey = playbackSkipLogEntryKey(reportedEntry);
    entries = entries.map((entry) =>
      playbackSkipLogEntryKey(entry) === reportedKey
        ? { ...entry, userReportSent: true }
        : entry,
    );
    refreshToast(lastOnClose);
  };

  return {
    completeUserReport,
    appendAndScheduleSkip: (
      entry: PlaybackSkipLogEntry,
      onSkip: () => void,
    ) => {
      entries = [...entries, entry];

      const handleClose = () => {
        entries = [];
      };

      refreshToast(handleClose);
      onSkip();
    },
    reset: () => {
      entries = [];
      dismissToast(PLAYBACK_SKIPPED_TRACKS_TOAST_ID);
    },
  };
};

const playbackSkipLogToast = createPlaybackSkipLogToast({
  showToast: ({ title, description, onClose }) => {
    showPersistentQueueAreaErrorToast({
      id: PLAYBACK_SKIPPED_TRACKS_TOAST_ID,
      title,
      description,
      onClose,
      toastClassName: "fmd-playback-skip-log-toast",
      headerAction: <PlaybackSkipHelpToastTrigger />,
    });
  },
  dismissToast: (id) => {
    toast.dismiss(id);
  },
});

registerPlaybackSkipUserReportComplete((entry, userReport) => {
  playbackSkipLogToast.completeUserReport(entry, userReport);
});

export const appendPlaybackSkipAndSchedule = (
  entry: PlaybackSkipLogEntry,
  onSkip: () => void,
): void => {
  playbackSkipLogToast.appendAndScheduleSkip(entry, onSkip);
};

export const resetPlaybackSkipLogToast = (): void => {
  playbackSkipLogToast.reset();
};
