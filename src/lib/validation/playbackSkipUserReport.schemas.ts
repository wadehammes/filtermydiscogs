import { definedProps } from "src/utils/definedProps";
import { z } from "zod";

export const PLAYBACK_SKIP_USER_REPORT_CATEGORY_VALUES = [
  "plays_on_youtube_not_here",
  "wrong_video",
  "stuck_loading",
  "other",
] as const;

export type PlaybackSkipUserReportCategory =
  (typeof PLAYBACK_SKIP_USER_REPORT_CATEGORY_VALUES)[number];

export const PLAYBACK_SKIP_USER_REPORT_NOTE_MAX_LENGTH = 500;

export const playbackSkipUserReportFormInputSchema = z.object({
  category: z
    .union([
      z.enum(PLAYBACK_SKIP_USER_REPORT_CATEGORY_VALUES),
      z.literal(""),
      z.null(),
    ])
    .optional(),
  note: z.string().max(PLAYBACK_SKIP_USER_REPORT_NOTE_MAX_LENGTH),
});

export type PlaybackSkipUserReportFormInput = z.infer<
  typeof playbackSkipUserReportFormInputSchema
>;

export const playbackSkipUserReportFormResolverSchema =
  playbackSkipUserReportFormInputSchema.refine(
    (
      values,
    ): values is PlaybackSkipUserReportFormInput & {
      category: PlaybackSkipUserReportCategory;
    } =>
      values.category !== undefined &&
      values.category !== "" &&
      values.category !== null,
    { message: "Choose an option", path: ["category"] },
  );

export type PlaybackSkipUserReportFormValues = {
  category: PlaybackSkipUserReportCategory;
  note?: string;
};

export const parsePlaybackSkipUserReportForm = (
  input: PlaybackSkipUserReportFormInput,
): PlaybackSkipUserReportFormValues => {
  const parsed = playbackSkipUserReportFormResolverSchema.parse(input);

  return definedProps({
    category: parsed.category,
    note: parsed.note.trim() || undefined,
  });
};
