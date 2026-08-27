"use client";

import { type InfiniteData, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { trackReleaseNoteSaved } from "src/analytics/productAnalyticsEvents";
import { updateCollectionNote } from "src/api/helpers";
import { useAuth } from "src/context/auth.context";
import { DiscogsCollectionQueryKeys } from "src/hooks/queries/querykeys.constants";
import { useCollectionFieldsQuery } from "src/hooks/queries/useCollectionFieldsQuery";
import type { DiscogsCollection, DiscogsRelease } from "src/types";
import {
  patchCollectionQueryReleaseNotes,
  patchPersistedCollectionReleaseNotes,
} from "src/utils/collectionCacheSync";
import type { CollectionPageParam } from "src/utils/collectionPagination";
import {
  buildCollectionFieldsMap,
  getEditableConditionFields,
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

  const editableConditionFields = useMemo(
    () => getEditableConditionFields(fieldsResponse?.fields ?? []),
    [fieldsResponse?.fields],
  );

  const canEdit =
    authState.isAuthenticated &&
    (editableFields.length > 0 || editableConditionFields.length > 0) &&
    parseReleaseId(release) !== null;

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
    options: { closeDialog?: boolean } = {},
  ): Promise<boolean> => {
    const { closeDialog = true } = options;
    const releaseId = parseReleaseId(release);
    if (!(releaseId && username)) {
      setErrorMessage("Unable to resolve release details for this note.");
      return false;
    }

    if (values.length === 0) {
      if (closeDialog) {
        setIsDialogOpen(false);
      }
      return true;
    }

    setErrorMessage(null);
    setIsSaving(true);

    const previousNotes = getReleaseNotes(release);
    let nextNotes = previousNotes;
    const collectionQueryKey = DiscogsCollectionQueryKeys.byUsername(username);
    const previousQueryData =
      queryClient.getQueryData<
        InfiniteData<DiscogsCollection, CollectionPageParam>
      >(collectionQueryKey);
    const instanceId = String(release.instance_id);

    for (const { fieldId, value } of values) {
      nextNotes = upsertReleaseNote({
        notes: nextNotes,
        fieldId,
        value,
      });
    }

    queryClient.setQueryData<
      InfiniteData<DiscogsCollection, CollectionPageParam>
    >(collectionQueryKey, (current) =>
      patchCollectionQueryReleaseNotes(current, instanceId, nextNotes),
    );

    try {
      for (const { fieldId, value } of values) {
        await updateCollectionNote({
          username,
          instanceId,
          fieldId,
          releaseId,
          folderId: getReleaseFolderId(release),
          value,
        });
      }

      if (closeDialog) {
        setIsDialogOpen(false);
      }
      trackReleaseNoteSaved(release.instance_id);
      await patchPersistedCollectionReleaseNotes(
        username,
        instanceId,
        nextNotes,
      );
      queryClient.invalidateQueries({
        queryKey: collectionQueryKey,
      });

      return true;
    } catch (error) {
      queryClient.setQueryData(collectionQueryKey, previousQueryData);
      await patchPersistedCollectionReleaseNotes(
        username,
        instanceId,
        previousNotes,
      );
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save note",
      );

      return false;
    } finally {
      setIsSaving(false);
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
    isSaving,
    openDialog,
  };
};
