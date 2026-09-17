import type { ReactNode } from "react";
import { getPlaybackQueueToastPosition } from "src/utils/playbackQueueToast";
import {
  formatPlaybackSkipLogTitle,
  type PlaybackSkipLogEntry,
} from "src/utils/playbackSkippedTrackLog";
import { toast } from "src/utils/toast";

export const PLAYBACK_SKIPPED_TRACKS_TOAST_ID = "playback-skipped-tracks";

export type { PlaybackSkipLogEntry };

const PlaybackSkipLogEntryContent = ({
  entry,
}: {
  entry: PlaybackSkipLogEntry;
}) => {
  return (
    <>
      <span className="fmd-playback-skip-log-track">{entry.trackLabel}</span>
      <span className="fmd-playback-skip-log-reason">{entry.reason}</span>
    </>
  );
};

const formatSkipLogDescription = (
  entries: PlaybackSkipLogEntry[],
): ReactNode => {
  if (entries.length === 1) {
    const entry = entries[0];

    if (!entry) {
      return null;
    }

    return (
      <div className="fmd-playback-skip-log">
        <div className="fmd-playback-skip-log-single">
          <PlaybackSkipLogEntryContent entry={entry} />
        </div>
      </div>
    );
  }

  return (
    <div className="fmd-playback-skip-log">
      <ul className="fmd-playback-skip-log-list">
        {entries.map((entry, index) => (
          <li
            key={`${index}-${entry.trackLabel}-${entry.reason}`}
            className="fmd-playback-skip-log-item"
          >
            <PlaybackSkipLogEntryContent entry={entry} />
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

export const createPlaybackSkipLogToast = ({
  showToast,
  dismissToast,
}: {
  showToast: (params: ShowToastParams) => void;
  dismissToast: (id: string) => void;
}) => {
  let entries: PlaybackSkipLogEntry[] = [];

  const refreshToast = (onClose: () => void) => {
    showToast({
      title: formatPlaybackSkipLogTitle(entries.length),
      description: formatSkipLogDescription(entries),
      onClose,
    });
  };

  return {
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
    toast.error(title, {
      id: PLAYBACK_SKIPPED_TRACKS_TOAST_ID,
      duration: Number.POSITIVE_INFINITY,
      position: getPlaybackQueueToastPosition(),
      description,
      showClose: true,
      onClose,
      classNames: {
        toast: "fmd-playback-skip-log-toast",
        description: "fmd-toast-description",
      },
    });
  },
  dismissToast: (id) => {
    toast.dismiss(id);
  },
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
