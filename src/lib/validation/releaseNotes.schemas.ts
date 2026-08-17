import { COLLECTION_NOTE_MAX_LENGTH } from "src/constants/collection";
import { z } from "zod";

export const RELEASE_NOTE_TOO_LONG_MESSAGE = `Note must be ${COLLECTION_NOTE_MAX_LENGTH} characters or less`;

export const releaseNoteTextValueSchema = z
  .string()
  .max(COLLECTION_NOTE_MAX_LENGTH, { message: RELEASE_NOTE_TOO_LONG_MESSAGE });

export const isReleaseNoteTextWithinLimit = (value: string): boolean =>
  releaseNoteTextValueSchema.safeParse(value).success;

export const buildReleaseNotesFormSchema = (textFieldIds: number[]) => {
  const textFieldKeys = new Set(textFieldIds.map(String));

  return z.record(z.string(), z.string()).superRefine((values, ctx) => {
    for (const [fieldKey, value] of Object.entries(values)) {
      if (!textFieldKeys.has(fieldKey)) {
        continue;
      }

      if (!isReleaseNoteTextWithinLimit(value)) {
        ctx.addIssue({
          code: "custom",
          path: [fieldKey],
          message: RELEASE_NOTE_TOO_LONG_MESSAGE,
        });
      }
    }
  });
};

export type ReleaseNotesFormValues = Record<string, string>;

export const releaseNotesCrateFieldSchema = z.object({
  value: releaseNoteTextValueSchema,
});

export type ReleaseNotesCrateFieldValues = z.infer<
  typeof releaseNotesCrateFieldSchema
>;
