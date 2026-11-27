const COLLECTION_COMMAND_CRATE_PROMPT_PATTERN = /\b(?:crate|crates)\b/i;

export const promptMentionsCollectionCrate = (prompt: string): boolean =>
  COLLECTION_COMMAND_CRATE_PROMPT_PATTERN.test(prompt.trim());

export const shouldClearCollectionCommandPreview = ({
  query,
  previewSourcePrompt,
  hasPreview,
}: {
  query: string;
  previewSourcePrompt: string | null;
  hasPreview: boolean;
}): boolean => {
  if (!(hasPreview && previewSourcePrompt)) {
    return false;
  }

  return query.trim() !== previewSourcePrompt;
};
