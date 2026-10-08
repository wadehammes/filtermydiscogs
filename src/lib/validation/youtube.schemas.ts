import { z } from "zod";

export const youtubeVideoIdSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9_-]{11}$/, "Invalid YouTube video id");

export const youtubeOembedQuerySchema = z.object({
  video_id: youtubeVideoIdSchema,
});
