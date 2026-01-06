import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useAuth } from "src/context/auth.context";
import { useSyncCratesMutation } from "src/hooks/queries/useCrateMutations";
import { useCratesQuery } from "src/hooks/queries/useCratesQuery";
import { useDiscogsCollectionQuery } from "src/hooks/queries/useDiscogsCollectionQuery";
import { getUsernameFromCookies } from "src/services/auth.service";

export const useCrateSync = () => {
  const { state: authState } = useAuth();
  const username = getUsernameFromCookies();
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasSyncedRef = useRef(false);
  const lastCollectionHashRef = useRef<string | null>(null);
  const mutationCooldownRef = useRef<number>(0);

  const { data: collectionData } = useDiscogsCollectionQuery(
    username || "",
    authState.isAuthenticated,
  );
  const { data: cratesData } = useCratesQuery();
  const syncMutation = useSyncCratesMutation();

  // Listen for mutation completion to set cooldown
  useEffect(() => {
    const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
      if (
        event?.type === "updated" &&
        (event.mutation.options.mutationKey?.[0] === "addReleaseToCrate" ||
          event.mutation.options.mutationKey?.[0] === "removeReleaseFromCrate")
      ) {
        const mutation = event.mutation;
        // Set cooldown when mutation completes (success or error)
        if (
          mutation.state.status === "success" ||
          mutation.state.status === "error"
        ) {
          // Set cooldown for 5 seconds after mutation completes
          mutationCooldownRef.current = Date.now() + 5000;
        }
      }
    });

    return unsubscribe;
  }, [queryClient]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't sync if mutations are pending or within cooldown period
    const now = Date.now();
    const mutations = queryClient.getMutationCache().getAll();
    const hasPendingMutations = mutations.some(
      (mutation) =>
        mutation.state.status === "pending" &&
        (mutation.options.mutationKey?.[0] === "addReleaseToCrate" ||
          mutation.options.mutationKey?.[0] === "removeReleaseFromCrate"),
    );

    if (hasPendingMutations || now < mutationCooldownRef.current) {
      return;
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
      // Double-check mutations aren't pending and cooldown has passed before syncing
      const now = Date.now();
      const mutations = queryClient.getMutationCache().getAll();
      const hasPendingMutations = mutations.some(
        (mutation) =>
          mutation.state.status === "pending" &&
          (mutation.options.mutationKey?.[0] === "addReleaseToCrate" ||
            mutation.options.mutationKey?.[0] === "removeReleaseFromCrate"),
      );

      if (
        !hasPendingMutations &&
        now >= mutationCooldownRef.current &&
        lastCollectionHashRef.current === collectionHash
      ) {
        syncMutation.mutate(
          { collectionInstanceIds },
          {
            onError: () => {
              hasSyncedRef.current = false;
            },
          },
        );
      } else {
        // Reset sync state if we can't sync yet
        hasSyncedRef.current = false;
      }
    }, 3000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    authState.isAuthenticated,
    collectionData,
    cratesData,
    syncMutation,
    queryClient,
  ]);

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
