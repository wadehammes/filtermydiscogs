import { SENTRY_USER_FEEDBACK_MESSAGE_MAX_LENGTH } from "src/constants/sentryUserFeedbackForm.constants";
import { z } from "zod";

const optionalEmailFieldSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    if (value.length === 0) {
      return;
    }

    const parsed = z.string().email().safeParse(value);
    if (!parsed.success) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid email address",
      });
    }
  });

export const sentryUserFeedbackFormSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Describe what went wrong")
    .max(
      SENTRY_USER_FEEDBACK_MESSAGE_MAX_LENGTH,
      `Message must be ${SENTRY_USER_FEEDBACK_MESSAGE_MAX_LENGTH} characters or less`,
    ),
  name: z.string().trim().max(120, "Name must be 120 characters or less"),
  email: optionalEmailFieldSchema,
});

export type SentryUserFeedbackFormValues = z.infer<
  typeof sentryUserFeedbackFormSchema
>;
