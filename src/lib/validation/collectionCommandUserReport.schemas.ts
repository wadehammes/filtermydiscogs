import { sentryUserFeedbackFormSchema } from "src/lib/validation/sentryUserFeedback.schemas";
import { definedProps } from "src/utils/definedProps";
import { z } from "zod";

export const COLLECTION_COMMAND_USER_REPORT_CATEGORY_VALUES = [
  "interpret_failed",
  "preview_wrong",
  "action_failed",
  "other",
] as const;

export type CollectionCommandUserReportCategory =
  (typeof COLLECTION_COMMAND_USER_REPORT_CATEGORY_VALUES)[number];

export const COLLECTION_COMMAND_USER_REPORT_DETAILS_MAX_LENGTH = 500;

export const collectionCommandSentryFeedbackFormInputSchema = z.object({
  category: z
    .union([
      z.enum(COLLECTION_COMMAND_USER_REPORT_CATEGORY_VALUES),
      z.literal(""),
      z.null(),
    ])
    .optional(),
  details: z.string().max(COLLECTION_COMMAND_USER_REPORT_DETAILS_MAX_LENGTH),
  name: sentryUserFeedbackFormSchema.shape.name,
  email: sentryUserFeedbackFormSchema.shape.email,
});

export type CollectionCommandSentryFeedbackFormInput = z.infer<
  typeof collectionCommandSentryFeedbackFormInputSchema
>;

export const collectionCommandSentryFeedbackFormResolverSchema =
  collectionCommandSentryFeedbackFormInputSchema.refine(
    (
      values,
    ): values is CollectionCommandSentryFeedbackFormInput & {
      category: CollectionCommandUserReportCategory;
    } =>
      values.category !== undefined &&
      values.category !== "" &&
      values.category !== null,
    { message: "Choose an option", path: ["category"] },
  );

export type CollectionCommandSentryFeedbackFormValues = {
  category: CollectionCommandUserReportCategory;
  details?: string;
  name: string;
  email: string;
};

export const parseCollectionCommandSentryFeedbackForm = (
  input: CollectionCommandSentryFeedbackFormInput,
): CollectionCommandSentryFeedbackFormValues => {
  const parsed = collectionCommandSentryFeedbackFormResolverSchema.parse(input);

  return definedProps({
    category: parsed.category,
    details: parsed.details.trim() || undefined,
    name: parsed.name,
    email: parsed.email,
  });
};
