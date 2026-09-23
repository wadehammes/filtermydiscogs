"use client";

import { useContext, useMemo } from "react";
import { useAuth } from "src/context/auth.context";
import { useCollectionFieldsQuery } from "src/hooks/queries/useCollectionFieldsQuery";
import { buildCollectionFieldsMap } from "src/utils/releaseNotes";
import {
  ReleaseNotesCollectionFieldsContext,
  type ReleaseNotesCollectionFieldsState,
} from "./ReleaseNotesCollectionFields.context";

export const useReleaseNotesCollectionFieldsSource = ({
  enabled = true,
}: {
  enabled?: boolean;
} = {}): ReleaseNotesCollectionFieldsState => {
  const { state: authState } = useAuth();
  const username = authState.username ?? "";
  const queryEnabled =
    enabled && authState.isAuthenticated && Boolean(username);

  const { data: fieldsResponse, isPending: isFieldsQueryPending } =
    useCollectionFieldsQuery({
      username,
      enabled: queryEnabled,
    });

  const fields = fieldsResponse?.fields ?? [];

  return useMemo(
    (): ReleaseNotesCollectionFieldsState => ({
      fields,
      fieldsById: buildCollectionFieldsMap(fields),
      isFieldsLoading: queryEnabled && isFieldsQueryPending,
    }),
    [fields, isFieldsQueryPending, queryEnabled],
  );
};

export const useReleaseNotesCollectionFields =
  (): ReleaseNotesCollectionFieldsState => {
    const fromContext = useContext(ReleaseNotesCollectionFieldsContext);
    const localSource = useReleaseNotesCollectionFieldsSource({
      enabled: fromContext === null,
    });

    return fromContext ?? localSource;
  };
