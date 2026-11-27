"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { useCollectionContext } from "src/context/collection.context";
import { DiscogsCollectionQueryKeys } from "src/hooks/queries/querykeys.constants";
import { resolveCollectionLastSyncedLabel } from "src/utils/formatCollectionLastSyncedLabel";

export const useCollectionLastSyncedLabel = ({
  username,
}: {
  username: string | null;
}): string | null => {
  const {
    state: { fetchingCollection },
  } = useCollectionContext();
  const queryClient = useQueryClient();
  const normalizedUsername = username?.trim() ?? "";

  const dataUpdatedAt = useSyncExternalStore(
    (onStoreChange) => queryClient.getQueryCache().subscribe(onStoreChange),
    () => {
      if (!normalizedUsername) {
        return null;
      }

      return (
        queryClient.getQueryState(
          DiscogsCollectionQueryKeys.byUsername(normalizedUsername),
        )?.dataUpdatedAt ?? null
      );
    },
    () => null,
  );

  return resolveCollectionLastSyncedLabel({
    dataUpdatedAt,
    fetchingCollection,
  });
};
