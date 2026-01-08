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
  // Only check if crates exist, don't watch for changes (that would trigger sync after mutations)
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

    // Only check if crates exist, don't require cratesData to be in dependency array
    // This prevents sync from running when crates refetch after mutations
    if (
      !(
        authState.isAuthenticated &&
        collectionData &&
        collectionData.pages?.length &&
        cratesData &&
        cratesData.crates &&
        Array.isArray(cratesData.crates)
      ) ||
      cratesData.crates.length === 0
    ) {
      return;
    }

    // Process collection data in a non-blocking way
    // Extract IDs efficiently using flatMap, then defer sorting/hashing to avoid blocking
    const extractIds = () => {
      // Use flatMap for better performance than nested loops
      const collectionInstanceIds = collectionData.pages
        .flatMap((page) => page?.releases ?? [])
        .map((release) => release?.instance_id)
        .filter((id): id is string => Boolean(id))
        .map(String);

      if (collectionInstanceIds.length === 0) {
        return;
      }

      // Defer sorting and hashing to avoid blocking the main thread
      const processHashAndSync = () => {
        // Sort in a deferred way to avoid blocking
        const sortedIds = collectionInstanceIds.sort();
        const collectionHash = sortedIds.join(",");

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
              { collectionInstanceIds: sortedIds },
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
      };

      // Defer sorting/hashing to avoid blocking - use requestIdleCallback if available
      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(processHashAndSync, { timeout: 1000 });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(processHashAndSync, 0);
      }
    };

    // Defer initial extraction to avoid blocking the main thread
    // Use requestIdleCallback to process when browser is idle, with 1s timeout fallback
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(extractIds, { timeout: 1000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(extractIds, 0);
    }

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
