import {
  COLLECTION_NOTE_MAX_LENGTH,
  COLLECTION_RATING_MAX,
  COLLECTION_RATING_MIN,
} from "src/constants/collection";
import { discogsUsernameSchema } from "src/lib/validation/discogs.shared.schemas";
import { z } from "zod";

export const updateCollectionNoteBodySchema = z.object({
  username: discogsUsernameSchema,
  releaseId: z
    .number({ error: "Valid release ID is required" })
    .int()
    .positive({ message: "Valid release ID is required" }),
  folderId: z
    .number({ error: "Valid folder ID is required" })
    .int()
    .min(0, { message: "Valid folder ID is required" })
    .optional()
    .default(0),
  value: z
    .string({ error: "Note value must be a string" })
    .max(COLLECTION_NOTE_MAX_LENGTH, {
      message: `Note value must be ${COLLECTION_NOTE_MAX_LENGTH} characters or less`,
    }),
});

export const updateReleaseRatingBodySchema = z.object({
  username: discogsUsernameSchema,
  rating: z
    .number({
      error: `Rating must be an integer between ${COLLECTION_RATING_MIN} and ${COLLECTION_RATING_MAX}`,
    })
    .int()
    .min(COLLECTION_RATING_MIN, {
      message: `Rating must be an integer between ${COLLECTION_RATING_MIN} and ${COLLECTION_RATING_MAX}`,
    })
    .max(COLLECTION_RATING_MAX, {
      message: `Rating must be an integer between ${COLLECTION_RATING_MIN} and ${COLLECTION_RATING_MAX}`,
    }),
});
