import { gateway } from "@ai-sdk/gateway";
import { generateText, Output } from "ai";
import {
  COLLECTION_COMMAND_AI_MODEL_ENV,
  COLLECTION_COMMAND_GATEWAY_KEY_ENV,
  DEFAULT_COLLECTION_COMMAND_AI_MODEL,
} from "src/constants/collectionCommand.constants";
import { logSanitizedApiRouteFailure } from "src/lib/api-helpers";
import {
  type CollectionCommandIntent,
  collectionCommandIntentGenerationSchema,
  parseCollectionCommandIntentFromLlm,
} from "src/lib/validation/collectionCommand.schemas";
import { applyPromptYearBoundsToIntent } from "src/utils/collectionCommandPromptYears";

export type InterpretCollectionCommandResult =
  | { intent: CollectionCommandIntent }
  | { error: "not_configured" | "interpret_failed" };

const resolveCollectionCommandModelId = (): string | null => {
  const configured = process.env[COLLECTION_COMMAND_AI_MODEL_ENV]?.trim();
  if (configured) {
    return configured;
  }

  return DEFAULT_COLLECTION_COMMAND_AI_MODEL;
};

const hasGatewayCredentials = (): boolean =>
  Boolean(process.env[COLLECTION_COMMAND_GATEWAY_KEY_ENV]?.trim()) ||
  Boolean(process.env.VERCEL_OIDC_TOKEN?.trim());

const buildSystemPrompt = (referenceDate: Date): string => {
  const calendarYear = referenceDate.getFullYear();
  const isoDate = referenceDate.toISOString().slice(0, 10);

  return [
    "You convert natural language into JSON filter intent for a Discogs vinyl collection app.",
    `Today's date is ${isoDate}. The current calendar year is ${calendarYear}. Use this for relative year phrases.`,
    "Map genre/style/format requests to selectedStyles, selectedFormats arrays.",
    "For explicit release years or decades, set selectedYears to those integers (OR operator).",
    "For ranges: use yearStartInclusive and yearEndExclusive (0 when unused).",
    "before YYYY → yearEndExclusive YYYY, selectedYears []. after YYYY → yearStartInclusive YYYY+1 unless inclusive after is stated.",
    `last N years → yearStartInclusive ${calendarYear}-N+1, yearEndExclusive ${calendarYear}+1, selectedYears [].`,
    "this year → single-year bounds on the current calendar year; last year → the prior calendar year only.",
    "Year-range filters without an explicit sort keep DateAddedNew in JSON; the app applies Release Year newest (AlbumYearNew) after sanitization.",
    "between YYYY and ZZZ → yearStartInclusive YYYY, yearEndExclusive ZZZ+1.",
    "Use styleOperator and formatOperator: OR (any tag), AND (all tags), NONE (exclude).",
    "Use yearOperator: OR or NONE.",
    "Put free-text artist, label, title, or note phrases in searchQuery.",
    "Pick selectedSort from: DateAddedNew, DateAddedOld, RatingHigh, RatingLow, AlbumYearNew, AlbumYearOld, AZTitle, ZATitle, AZArtist, ZAArtist.",
    "Use selectedSortSecondary None unless a clear tie-breaker is requested.",
    "Set suggestedViewName only when the user explicitly names a saved view (max 40 chars); otherwise use an empty string (the app builds a short title from filters).",
    "Put caveats in confidenceNotes when intent is ambiguous; otherwise use an empty string.",
    "Do not invent rating or date-added filters; use sort instead for ordered results.",
    "Return only fields defined in the schema.",
  ].join(" ");
};

export const interpretCollectionCommandPrompt = async (
  prompt: string,
): Promise<InterpretCollectionCommandResult> => {
  if (!hasGatewayCredentials()) {
    return { error: "not_configured" };
  }

  const modelId = resolveCollectionCommandModelId();
  if (!modelId) {
    return { error: "not_configured" };
  }

  try {
    const referenceDate = new Date();
    const { output } = await generateText({
      model: gateway(modelId),
      system: buildSystemPrompt(referenceDate),
      prompt,
      output: Output.object({
        schema: collectionCommandIntentGenerationSchema,
      }),
    });

    if (!output) {
      return { error: "interpret_failed" };
    }

    const parsed = parseCollectionCommandIntentFromLlm(output);
    if (!parsed) {
      return { error: "interpret_failed" };
    }

    const intent: CollectionCommandIntent = applyPromptYearBoundsToIntent(
      parsed,
      prompt,
      referenceDate,
    );

    return { intent };
  } catch (error) {
    logSanitizedApiRouteFailure(
      "collection-command-interpret",
      error,
      "Collection command interpret failed",
    );
    return { error: "interpret_failed" };
  }
};
