import { useEffect, useRef } from "react";
import { useAuth } from "src/context/auth.context";
import { useSyncCratesMutation } from "src/hooks/queries/useCrateMutations";
import { useCratesQuery } from "src/hooks/queries/useCratesQuery";
import { useDiscogsCollectionQuery } from "src/hooks/queries/useDiscogsCollectionQuery";
import { getUsernameFromCookies } from "src/services/auth.service";

export const useCrateSync = () => {
  const { state: authState } = useAuth();
  const username = getUsernameFromCookies();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasSyncedRef = useRef(false);
  const lastCollectionHashRef = useRef<string | null>(null);

  const { data: collectionData } = useDiscogsCollectionQuery(
    username || "",
    authState.isAuthenticated,
  );
  const { data: cratesData } = useCratesQuery();
  const syncMutation = useSyncCratesMutation();

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (
      !(authState.isAuthenticated && collectionData && cratesData) ||
      cratesData.crates.length === 0 ||
      !collectionData.pages?.length
    ) {
      return;
    }

    const collectionInstanceIds: string[] = [];
    for (const page of collectionData.pages) {
      if (page?.releases) {
        for (const release of page.releases) {
          if (release?.instance_id) {
            collectionInstanceIds.push(String(release.instance_id));
          }
        }
      }
    }

    if (collectionInstanceIds.length === 0) {
      return;
    }

    const collectionHash = collectionInstanceIds.sort().join(",");

    if (
      hasSyncedRef.current &&
      lastCollectionHashRef.current === collectionHash
    ) {
      return;
    }

    hasSyncedRef.current = true;
    lastCollectionHashRef.current = collectionHash;

    debounceTimerRef.current = setTimeout(() => {
      syncMutation.mutate(
        { collectionInstanceIds },
        {
          onError: () => {
            hasSyncedRef.current = false;
          },
        },
      );
    }, 2500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [authState.isAuthenticated, collectionData, cratesData, syncMutation]);

  useEffect(() => {
    if (!authState.isAuthenticated) {
      hasSyncedRef.current = false;
      lastCollectionHashRef.current = null;
    }
  }, [authState.isAuthenticated]);

  return {
    isSyncing: syncMutation.isPending,
    lastSyncResult: syncMutation.data,
  };
};
