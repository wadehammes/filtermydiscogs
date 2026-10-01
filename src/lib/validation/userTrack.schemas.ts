import { normalizeYoutubeVideoInput } from "src/utils/userTrack";
import { z } from "zod";

export const TRACK_YOUTUBE_OVERRIDE_INVALID_INPUT_MESSAGE =
  "Enter a valid YouTube URL or 11-character video ID.";

const youtubeIdPattern = /^[a-zA-Z0-9_-]{11}$/;

const youtubeIdSchema = z
  .string()
  .regex(youtubeIdPattern, "Invalid YouTube video id")
  .optional();

export const youtubeVideoIdSchema = z
  .string()
  .regex(youtubeIdPattern, "Invalid YouTube video id");

export const userTrackRecordBodySchema = z.object({
  event: z.enum(["play", "listen"]),
  track_key: z.string().min(1).max(512),
  track_title: z.string().min(1).max(500),
  track_position: z.string().min(1).max(128),
  instance_id: z.string().min(1).max(64),
  youtube_id: youtubeIdSchema,
  artist: z.string().max(500).optional(),
  release_title: z.string().max(500).optional(),
});

export type UserTrackRecordBody = z.infer<typeof userTrackRecordBodySchema>;

export const userTrackYoutubeOverrideBodySchema = z.object({
  track_key: z.string().min(1).max(512),
  track_title: z.string().min(1).max(500),
  track_position: z.string().min(1).max(128),
  instance_id: z.string().min(1).max(64),
  youtube_id: z.union([youtubeVideoIdSchema, z.null()]),
  artist: z.string().max(500).optional(),
  release_title: z.string().max(500).optional(),
});

export type UserTrackYoutubeOverrideBody = z.infer<
  typeof userTrackYoutubeOverrideBodySchema
>;

export const trackYoutubeOverrideFormSchema = z
  .object({
    youtubeInput: z.string(),
  })
  .superRefine((values, ctx) => {
    const trimmed = values.youtubeInput.trim();

    if (!trimmed) {
      return;
    }

    if (!normalizeYoutubeVideoInput(values.youtubeInput)) {
      ctx.addIssue({
        code: "custom",
        message: TRACK_YOUTUBE_OVERRIDE_INVALID_INPUT_MESSAGE,
        path: ["youtubeInput"],
      });
    }
  });

export type TrackYoutubeOverrideFormValues = z.infer<
  typeof trackYoutubeOverrideFormSchema
>;

export const userTrackStatsQuerySchema = z.object({
  keys: z
    .string()
    .min(1)
    .transform((value) =>
      value
        .split(",")
        .map((key) => key.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().min(1).max(512)).max(100)),
});
