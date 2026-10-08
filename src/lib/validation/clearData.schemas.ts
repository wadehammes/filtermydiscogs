import { CLEAR_ALL_DATA_CONFIRM_PHRASE } from "src/constants/clearData.constants";
import { z } from "zod";

export const clearAllDataConfirmFormSchema = z.object({
  phrase: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .superRefine((value, ctx) => {
      if (value !== CLEAR_ALL_DATA_CONFIRM_PHRASE) {
        ctx.addIssue({
          code: "custom",
          message: `Type ${CLEAR_ALL_DATA_CONFIRM_PHRASE} exactly to confirm.`,
        });
      }
    }),
});

export type ClearAllDataConfirmFormValues = z.input<
  typeof clearAllDataConfirmFormSchema
>;
