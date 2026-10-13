import { TRACK_YOUTUBE_OVERRIDE_INVALID_INPUT_MESSAGE } from "src/lib/validation/userTrack.schemas";
import { normalizeYoutubeVideoInput } from "src/utils/userTrack";
import { z } from "zod";

export const adminYoutubeEmbedFormSchema = z
  .object({
    youtubeInput: z.string(),
    autoplay: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const trimmed = values.youtubeInput.trim();

    if (!trimmed) {
      ctx.addIssue({
        code: "custom",
        message: TRACK_YOUTUBE_OVERRIDE_INVALID_INPUT_MESSAGE,
        path: ["youtubeInput"],
      });
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

export type AdminYoutubeEmbedFormValues = z.infer<
  typeof adminYoutubeEmbedFormSchema
>;
