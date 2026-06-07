"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { updateCollectionNote } from "src/api/helpers";
import { FiltersActionTypes } from "src/atoms/filters.atoms";
import { useAuth } from "src/context/auth.context";
import { DiscogsCollectionQueryKeys } from "src/hooks/queries/querykeys.constants";
import { useCollectionFieldsQuery } from "src/hooks/queries/useCollectionFieldsQuery";
import {
  useAllReleases,
  useFiltersDispatch,
} from "src/hooks/useFilterAtoms.hook";
import type { DiscogsRelease } from "src/types";
import {
  buildCollectionFieldsMap,
  getReleaseFolderId,
  getReleaseNotes,
  getReleaseNotesDisplay,
  isEditableCollectionField,
  parseReleaseId,
  upsertReleaseNote,
} from "src/utils/releaseNotes";

export const useReleaseNotesEditor = (release: DiscogsRelease) => {
  const { state: authState } = useAuth();
  const username = authState.username ?? "";
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const canEdit =
    authState.isAuthenticated &&
    editableFields.length > 0 &&
    parseReleaseId(release) !== null;

  const dispatch = useFiltersDispatch();
  const allReleases = useAllReleases();
  const queryClient = useQueryClient();

  const openDialog = () => {
    setErrorMessage(null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    if (!isSaving) {
      setIsDialogOpen(false);
      setErrorMessage(null);
    }
  };

  const handleSave = async (
    values: Array<{ fieldId: number; value: string }>,
  ) => {
    const releaseId = parseReleaseId(release);
    if (!(releaseId && username)) {
      setErrorMessage("Unable to resolve release details for this note.");
      return;
    }

    if (values.length === 0) {
      setIsDialogOpen(false);
      return;
    }

    setErrorMessage(null);
    setIsSaving(true);

    const previousReleases = allReleases;
    let nextNotes = getReleaseNotes(release);

    for (const { fieldId, value } of values) {
      nextNotes = upsertReleaseNote({
        notes: nextNotes,
        fieldId,
        value,
      });
    }

    const optimisticReleases = previousReleases.map((item) =>
      String(item.instance_id) === String(release.instance_id)
        ? { ...item, notes: nextNotes }
        : item,
    );

    dispatch({
      type: FiltersActionTypes.SetAllReleases,
      payload: optimisticReleases,
    });

    try {
      for (const { fieldId, value } of values) {
        await updateCollectionNote({
          username,
          instanceId: String(release.instance_id),
          fieldId,
          releaseId,
          folderId: getReleaseFolderId(release),
          value,
        });
      }

      setIsDialogOpen(false);
      queryClient.invalidateQueries({
        queryKey: DiscogsCollectionQueryKeys.byUsername(username),
      });
    } catch (error) {
      dispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: previousReleases,
      });
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save note",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
    canEdit,
    closeDialog,
    displayedNotes,
    editableFields,
    errorMessage,
    fields: fieldsResponse?.fields ?? [],
    handleSave,
    cardDisplayedNotes,
    hasNotes: cardDisplayedNotes.length > 0,
    isDialogOpen,
    isSaving,
    openDialog,
  };
};
