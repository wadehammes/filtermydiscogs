import { RELEASE_BATCH_MAX_IDS } from "src/constants/collection";
import { z } from "zod";

const releaseIdFieldSchema = z
  .string({ error: "Release ids must be strings" })
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .regex(/^\d+$/, { message: "Release id must be numeric" })
      .max(10, { message: "Release id is too long" }),
  );

export const releaseBatchBodySchema = z.object({
  ids: z
    .array(releaseIdFieldSchema, { error: "ids must be an array" })
    .min(1, { message: "At least one release id is required" })
    .max(RELEASE_BATCH_MAX_IDS, {
      message: `At most ${RELEASE_BATCH_MAX_IDS} release ids are allowed`,
    }),
});
