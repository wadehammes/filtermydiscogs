import { COLLECTION_COMMAND_PROMPT_MAX_LENGTH } from "src/constants/collectionCommand.constants";
import {
  SortSecondaryValues,
  SortValues,
  VALID_SORT_SECONDARY_VALUES,
  VALID_SORT_VALUES,
} from "src/constants/sortValues";
import {
  VALID_STYLE_OPERATORS,
  VALID_YEAR_OPERATORS,
} from "src/types/filters.types";
import { z } from "zod";

const styleOperatorSchema = z
  .string()
  .refine((value) => VALID_STYLE_OPERATORS.has(value as never), {
    message: "Invalid style operator",
  });

const yearOperatorSchema = z
  .string()
  .refine((value) => VALID_YEAR_OPERATORS.has(value as never), {
    message: "Invalid year operator",
  });

const sortValueSchema = z
  .string()
  .refine((value) => VALID_SORT_VALUES.has(value), {
    message: "Invalid sort value",
  });

const sortSecondarySchema = z
  .string()
  .refine((value) => VALID_SORT_SECONDARY_VALUES.has(value), {
    message: "Invalid secondary sort value",
  });

export const collectionCommandPromptBodySchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .max(COLLECTION_COMMAND_PROMPT_MAX_LENGTH, "Prompt is too long")
    .transform((value) => value.trim()),
});

export const collectionCommandIntentGenerationSchema = z.object({
  searchQuery: z.string(),
  selectedStyles: z.array(z.string()),
  excludedStyles: z.array(z.string()),
  selectedYears: z.array(z.number().int()),
  selectedFormats: z.array(z.string()),
  styleOperator: styleOperatorSchema,
  formatOperator: styleOperatorSchema,
  yearOperator: yearOperatorSchema,
  selectedSort: sortValueSchema,
  selectedSortSecondary: sortSecondarySchema,
  suggestedViewName: z.string().max(40),
  confidenceNotes: z.string().max(240),
  yearStartInclusive: z.number().int(),
  yearEndExclusive: z.number().int(),
});

const collectionCommandIntentDefaultsSchema = z.object({
  searchQuery: z.string().default(""),
  selectedStyles: z.array(z.string()).default([]),
  excludedStyles: z.array(z.string()).default([]),
  selectedYears: z.array(z.number().int()).default([]),
  selectedFormats: z.array(z.string()).default([]),
  styleOperator: styleOperatorSchema.default("OR"),
  formatOperator: styleOperatorSchema.default("OR"),
  yearOperator: yearOperatorSchema.default("OR"),
  selectedSort: sortValueSchema.default(SortValues.DateAddedNew),
  selectedSortSecondary: sortSecondarySchema.default(SortSecondaryValues.None),
  suggestedViewName: z.string().max(40).optional(),
  confidenceNotes: z.string().max(240).optional(),
  yearStartInclusive: z.number().int().default(0),
  yearEndExclusive: z.number().int().default(0),
});

export const collectionCommandIntentSchema =
  collectionCommandIntentDefaultsSchema;

export type CollectionCommandIntent = z.infer<
  typeof collectionCommandIntentSchema
>;

export const parseCollectionCommandIntentFromLlm = (
  output: unknown,
): CollectionCommandIntent | null => {
  const generated = collectionCommandIntentGenerationSchema.safeParse(output);
  if (!generated.success) {
    return null;
  }

  const intent = generated.data;
  const normalized = collectionCommandIntentSchema.safeParse({
    ...intent,
    suggestedViewName: intent.suggestedViewName.trim() || undefined,
    confidenceNotes: intent.confidenceNotes.trim() || undefined,
  });

  return normalized.success ? normalized.data : null;
};
