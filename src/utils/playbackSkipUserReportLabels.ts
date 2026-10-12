import type { PlaybackSkipUserReportCategory } from "src/lib/validation/playbackSkipUserReport.schemas";
import { PLAYBACK_SKIP_USER_REPORT_CATEGORY_VALUES } from "src/lib/validation/playbackSkipUserReport.schemas";

export const PLAYBACK_SKIP_USER_REPORT_CATEGORY_LABELS: Record<
  PlaybackSkipUserReportCategory,
  string
> = {
  plays_on_youtube_not_here: "Plays on YouTube but not here",
  wrong_video: "Wrong video",
  stuck_loading: "Stuck loading",
  other: "Something else",
};

export const PLAYBACK_SKIP_USER_REPORT_CATEGORY_OPTIONS =
  PLAYBACK_SKIP_USER_REPORT_CATEGORY_VALUES.map((value) => ({
    value,
    label: PLAYBACK_SKIP_USER_REPORT_CATEGORY_LABELS[value],
  }));
