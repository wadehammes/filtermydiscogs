export const PLAYBACK_SKIP_HELP_DIALOG_TITLE = "Why tracks skip";

export const PLAYBACK_SKIP_HELP_INTRO =
  "Skips use YouTube embeds from Discogs or a link you set on the track.";

export type PlaybackSkipHelpSection = {
  reason: string;
  detail: string;
};

export const PLAYBACK_SKIP_HELP_SECTIONS: PlaybackSkipHelpSection[] = [
  {
    reason: "Private or removed on YouTube",
    detail:
      "Video is private, deleted, or blocked. Set another link from the track menu.",
  },
  {
    reason: "Cannot play in embedded player",
    detail:
      "Uploader disabled embeds. Pick another upload or an embeddable link.",
  },
  {
    reason: "Invalid YouTube video",
    detail:
      "Missing or invalid video ID. Set a working YouTube URL on the track.",
  },
  {
    reason: "YouTube playback error",
    detail: "Player error. Retry, change the link, or Report on the toast.",
  },
  {
    reason: "Unavailable on YouTube",
    detail: "Embed failed. Try another link, or Report if it plays on YouTube.",
  },
  {
    reason: "Private, removed, blocked, or still loading",
    detail:
      "Playback did not start in time (network or embed). Retry, or Report a false skip.",
  },
];

export const PLAYBACK_SKIP_HELP_REPORT_NOTE =
  "Wrong skip? Use Report on that row in the toast.";

export const PLAYBACK_SKIP_HELP_TRIGGER_LABEL = "Why tracks skip";
