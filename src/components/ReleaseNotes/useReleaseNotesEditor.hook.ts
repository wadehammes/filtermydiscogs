"use client";

import { useMemo, useState } from "react";
import { useAuth } from "src/context/auth.context";
import { useSaveReleaseNotesMutation } from "src/hooks/mutations/useCollectionMutations";
import { useCollectionFieldsQuery } from "src/hooks/queries/useCollectionFieldsQuery";
import type { DiscogsRelease } from "src/types";
import {
  buildCollectionFieldsMap,
  getEditableConditionFields,
  getReleaseNotesDisplay,
  isEditableCollectionField,
  parseReleaseId,
} from "src/utils/releaseNotes";

export const useReleaseNotesEditor = (release: DiscogsRelease) => {
  const { state: authState } = useAuth();
  const username = authState.username ?? "";
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const saveNotesMutation = useSaveReleaseNotesMutation({ username });

  const { data: fieldsResponse } = useCollectionFieldsQuery({
    username,
    enabled: authState.isAuthenticated && !!username,
  });

  const fieldsById = useMemo(
    () => buildCollectionFieldsMap(fieldsResponse?.fields ?? []),
    [fieldsResponse?.fields],
  );

  const displayedNotes = useMemo(
    () => getReleaseNotesDisplay({ release, fieldsById }),
    [release, fieldsById],
  );

  const cardDisplayedNotes = useMemo(
    () => getReleaseNotesDisplay({ release, fieldsById, forCard: true }),
    [release, fieldsById],
  );

  const editableFields = useMemo(
    () =>
      (fieldsResponse?.fields ?? []).filter((field) =>
        isEditableCollectionField(field),
      ),
    [fieldsResponse?.fields],
  );

  const editableConditionFields = useMemo(
    () => getEditableConditionFields(fieldsResponse?.fields ?? []),
    [fieldsResponse?.fields],
  );

  const canEdit =
    authState.isAuthenticated &&
    (editableFields.length > 0 || editableConditionFields.length > 0) &&
    parseReleaseId(release) !== null;

  const openDialog = () => {
    setErrorMessage(null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    if (!saveNotesMutation.isPending) {
      setIsDialogOpen(false);
      setErrorMessage(null);
    }
  };

  const handleSave = async (
    values: Array<{ fieldId: number; value: string }>,
    options: { closeDialog?: boolean } = {},
  ): Promise<boolean> => {
    const { closeDialog: shouldCloseDialog = true } = options;

    if (!(parseReleaseId(release) && username)) {
      setErrorMessage("Unable to resolve release details for this note.");
      return false;
    }

    if (values.length === 0) {
      if (shouldCloseDialog) {
        setIsDialogOpen(false);
      }
      return true;
    }

    setErrorMessage(null);

    try {
      await saveNotesMutation.mutateAsync({ release, values });

      if (shouldCloseDialog) {
        setIsDialogOpen(false);
      }

      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save note",
      );

      return false;
    }
  };

  return {
    canEdit,
    closeDialog,
    displayedNotes,
    editableFields,
    editableConditionFields,
    errorMessage,
    fields: fieldsResponse?.fields ?? [],
    handleSave,
    cardDisplayedNotes,
    hasNotes: cardDisplayedNotes.length > 0,
    isDialogOpen,
    isSaving: saveNotesMutation.isPending,
    openDialog,
  };
};
