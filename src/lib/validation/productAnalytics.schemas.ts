import {
  PRODUCT_ANALYTICS_MAX_BATCH_SIZE,
  type ProductAnalyticsEventInput,
} from "src/types/productAnalytics.types";
import { z } from "zod";

const MAX_FIELD_LENGTH = 200;

const requiredAnalyticsString = (fieldName: string) =>
  z
    .string()
    .superRefine((value, ctx) => {
      const trimmed = value.trim();

      if (!trimmed) {
        ctx.addIssue({
          code: "custom",
          message: `${fieldName} is required`,
        });
      }

      if (trimmed.length > MAX_FIELD_LENGTH) {
        ctx.addIssue({
          code: "custom",
          message: `${fieldName} is too long`,
        });
      }
    })
    .transform((value) => value.trim());

const optionalAnalyticsStringField = (tooLongMessage: string) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .superRefine((value, ctx) => {
      if (typeof value === "string" && value.length > MAX_FIELD_LENGTH) {
        ctx.addIssue({
          code: "custom",
          message: tooLongMessage,
        });
      }
    })
    .transform((value) => {
      if (value === undefined || value === null) {
        return null;
      }

      const trimmed = value.trim();
      return trimmed.length === 0 ? null : trimmed;
    });

const productAnalyticsEventSchema = z.object({
  event: requiredAnalyticsString("event"),
  category: requiredAnalyticsString("category"),
  action: requiredAnalyticsString("action"),
  label: requiredAnalyticsString("label"),
  value: optionalAnalyticsStringField("value is too long"),
  page_path: optionalAnalyticsStringField("page_path is too long"),
});

const productAnalyticsEventsSchema = z
  .array(productAnalyticsEventSchema)
  .min(1, { message: "events must not be empty" })
  .max(PRODUCT_ANALYTICS_MAX_BATCH_SIZE, {
    message: `events must contain at most ${PRODUCT_ANALYTICS_MAX_BATCH_SIZE} items`,
  });

export const validateProductAnalyticsBatch = (
  events: unknown,
): { events: ProductAnalyticsEventInput[] } | { error: string } => {
  if (!Array.isArray(events)) {
    return { error: "events must be an array" };
  }

  const parseResult = productAnalyticsEventsSchema.safeParse(events);

  if (!parseResult.success) {
    const issue = parseResult.error.issues[0];

    if (issue?.code === "invalid_type" && issue.path.length === 1) {
      return { error: "each event must be an object" };
    }

    return { error: issue?.message ?? "Invalid analytics events" };
  }

  return { events: parseResult.data };
};
