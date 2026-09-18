import { z } from "zod";

const youtubeIdSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_-]{11}$/, "Invalid YouTube video id")
  .optional();

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
