import {
  CRATE_MARKER_MAX_LENGTH,
  CRATE_NAME_MAX_LENGTH,
  CRATE_NOTES_MAX_LENGTH,
} from "src/constants/crate";
import type {
  CrateLayoutPutItem,
  CrateLayoutPutRequest,
} from "src/types/crate.types";
import { z } from "zod";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const validateCrateName = (
  value: string,
  ctx: z.RefinementCtx,
  requiredMessage = "Crate name is required",
) => {
  if (value.trim().length === 0) {
    ctx.addIssue({
      code: "custom",
      message: requiredMessage,
    });
  }

  if (value.length > CRATE_NAME_MAX_LENGTH) {
    ctx.addIssue({
      code: "custom",
      message: `Crate name must be ${CRATE_NAME_MAX_LENGTH} characters or less`,
    });
  }
};

const crateNameFieldSchema = z
  .string({ error: "Crate name is required" })
  .superRefine((value, ctx) => {
    validateCrateName(value, ctx);
  })
  .transform((value) => value.trim());

const optionalCrateNameFieldSchema = z
  .string({ error: "Crate name is required" })
  .optional()
  .superRefine((value, ctx) => {
    if (value === undefined) {
      return;
    }

    validateCrateName(value, ctx);
  })
  .transform((value) => (value === undefined ? undefined : value.trim()));

const optionalCrateBooleanField = (fieldName: string) =>
  z
    .boolean({ error: `${fieldName} must be a boolean` })
    .nullable()
    .optional()
    .transform((value) => value ?? undefined);

const notesFieldSchema = z
  .union([z.string(), z.null()])
  .optional()
  .superRefine((value, ctx) => {
    if (value === undefined || value === null || typeof value !== "string") {
      return;
    }

    if (value.trim().length > CRATE_NOTES_MAX_LENGTH) {
      ctx.addIssue({
        code: "custom",
        message: `Crate notes must be ${CRATE_NOTES_MAX_LENGTH} characters or less`,
      });
    }
  })
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  });

export const createCrateBodySchema = z.object({
  name: crateNameFieldSchema,
});

export const editCrateNameFormSchema = createCrateBodySchema.extend({
  deleteConfirm: z.string(),
});

export const crateNotesScratchpadSchema = z.object({
  notes: z.string().max(CRATE_NOTES_MAX_LENGTH, {
    message: `Crate notes must be ${CRATE_NOTES_MAX_LENGTH} characters or less`,
  }),
});

export const crateSetMarkerLabelSchema = z.object({
  label: z.string().max(CRATE_MARKER_MAX_LENGTH),
});

export const updateCrateBodySchema = z.object({
  name: optionalCrateNameFieldSchema,
  is_default: z.boolean({ error: "is_default must be a boolean" }).optional(),
  private: optionalCrateBooleanField("private"),
  packed_enabled: optionalCrateBooleanField("packed_enabled"),
  notes: notesFieldSchema,
});

export type EditCrateNameFormValues = z.infer<typeof editCrateNameFormSchema>;
export type CrateNotesScratchpadValues = z.infer<
  typeof crateNotesScratchpadSchema
>;
export type CrateSetMarkerLabelValues = z.infer<
  typeof crateSetMarkerLabelSchema
>;

const crateLayoutPutMarkerLabelField = z
  .string({ error: "Marker layout items require label" })
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .min(1, { message: "Marker label is required" })
      .max(CRATE_MARKER_MAX_LENGTH, {
        message: `Marker label must be ${CRATE_MARKER_MAX_LENGTH} characters or less`,
      }),
  );

const crateLayoutPutReleaseItemSchema = z.object({
  kind: z.literal("release"),
  instance_id: z
    .string({ error: "Release layout items require instance_id" })
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, { message: "Release layout items require instance_id" }),
    ),
});

const crateLayoutPutMarkerWithoutIdSchema = z.object({
  kind: z.literal("marker"),
  label: crateLayoutPutMarkerLabelField,
});

const crateLayoutPutMarkerWithIdSchema = z.object({
  kind: z.literal("marker"),
  id: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z.string().min(1, {
        message: "Marker id must be a non-empty string when provided",
      }),
    ),
  label: crateLayoutPutMarkerLabelField,
});

const crateLayoutPutMarkerItemSchema = z.union([
  crateLayoutPutMarkerWithoutIdSchema,
  crateLayoutPutMarkerWithIdSchema,
]);

const crateLayoutPutItemSchema = z.union([
  crateLayoutPutReleaseItemSchema,
  crateLayoutPutMarkerItemSchema,
]);

export const crateLayoutPutRequestSchema = z.object({
  items: z.array(crateLayoutPutItemSchema, {
    error: "items must be an array",
  }),
});

export const parseCrateLayoutPutRequest = (
  body: unknown,
): { data: CrateLayoutPutRequest } | { error: string } => {
  if (!isRecord(body)) {
    return { error: "Request body must be an object" };
  }

  const parseResult = crateLayoutPutRequestSchema.safeParse(body);

  if (!parseResult.success) {
    const issue = parseResult.error.issues[0];
    return { error: issue?.message ?? "Invalid request body" };
  }

  return {
    data: {
      items: parseResult.data.items as CrateLayoutPutItem[],
    },
  };
};

export const crateSyncBodySchema = z.object({
  collectionInstanceIds: z.array(z.union([z.string(), z.number()]), {
    error: "collectionInstanceIds must be an array",
  }),
  force: z.boolean().optional().default(false),
});

export const clearCrateFoundBodySchema = z.object({
  clear_found: z.literal(true, {
    error: "clear_found must be true",
  }),
});
