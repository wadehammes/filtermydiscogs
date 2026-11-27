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
