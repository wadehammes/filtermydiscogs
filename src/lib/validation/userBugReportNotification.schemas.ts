import {
  SENTRY_COLLECTION_COMMAND_FEEDBACK_SOURCE_TAG,
  SENTRY_USER_FEEDBACK_MESSAGE_MAX_LENGTH,
  SENTRY_USER_FEEDBACK_SOURCE_TAG,
} from "src/constants/sentryUserFeedbackForm.constants";
import { sentryUserFeedbackFormSchema } from "src/lib/validation/sentryUserFeedback.schemas";
import { z } from "zod";

export const USER_BUG_REPORT_FEEDBACK_SOURCE_TAGS = [
  SENTRY_USER_FEEDBACK_SOURCE_TAG,
  SENTRY_COLLECTION_COMMAND_FEEDBACK_SOURCE_TAG,
] as const;

export const userBugReportNotificationBodySchema = z.object({
  message: z
    .string()
    .trim()
    .min(1)
    .max(SENTRY_USER_FEEDBACK_MESSAGE_MAX_LENGTH),
  feedbackSourceTag: z.enum(USER_BUG_REPORT_FEEDBACK_SOURCE_TAGS).optional(),
  name: sentryUserFeedbackFormSchema.shape.name.optional(),
  email: sentryUserFeedbackFormSchema.shape.email.optional(),
});

export type UserBugReportNotificationBody = z.infer<
  typeof userBugReportNotificationBodySchema
>;
