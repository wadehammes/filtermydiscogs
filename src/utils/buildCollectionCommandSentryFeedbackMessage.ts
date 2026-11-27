import type { CollectionCommandPreviewFact } from "src/utils/collectionCommandPreview";

export type CollectionCommandSentryFeedbackContext = {
  prompt: string;
  interpretError?: string;
  preview?: {
    matchCount: number;
    facts: CollectionCommandPreviewFact[];
  };
};

export type BuildCollectionCommandSentryFeedbackMessageInput = {
  context: CollectionCommandSentryFeedbackContext;
  categoryLabel: string;
  details?: string;
};

export const buildCollectionCommandSentryFeedbackMessage = ({
  context,
  categoryLabel,
  details,
}: BuildCollectionCommandSentryFeedbackMessageInput): string => {
  const lines = ["Collection command issue", ""];

  const prompt = context.prompt.trim();
  if (prompt.length > 0) {
    lines.push(`Prompt: ${prompt}`);
  }

  if (context.interpretError) {
    lines.push("", `Interpret error: ${context.interpretError}`);
  }

  if (context.preview) {
    lines.push("", `Matches: ${context.preview.matchCount}`);
    for (const fact of context.preview.facts) {
      lines.push(`${fact.label}: ${fact.value}`);
    }
  }

  lines.push("", `Issue: ${categoryLabel}`);

  const trimmedDetails = details?.trim();
  if (trimmedDetails) {
    lines.push("", "Details:", trimmedDetails);
  }

  return lines.join("\n");
};
