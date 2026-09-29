"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  trackCrateCleared,
  trackCrateCreated,
  trackCrateDeleted,
  trackCrateNotesSaved,
  trackCratePackedCleared,
  trackCratePackingEnabled,
  trackCrateReleaseAdded,
  trackCrateReleaseRemoved,
  trackCrateVisibilityChanged,
  trackReleasePacked,
} from "src/analytics/productAnalyticsEvents";
import { useAuth } from "src/context/auth.context";
import type { CrateActions, CrateState } from "src/context/crate.context.types";
import {
  useAddReleaseToCrateMutation,
  useClearAllPackedInCrateMutation,
  useCreateCrateMutation,
  useDeleteCrateMutation,
  useRemoveReleaseFromCrateMutation,
  useSetReleaseCrateMembershipMutation,
  useSetReleasePackedInCrateMutation,
  useUpdateCrateLayoutMutation,
  useUpdateCrateMutation,
} from "src/hooks/mutations/useCrateMutations";
import {
  CrateQueryKeys,
  CratesQueryKeys,
} from "src/hooks/queries/querykeys.constants";
import {
  useCrateQuery,
  useCratesQuery,
} from "src/hooks/queries/useCratesQuery";
import { useCrateDrawer } from "src/hooks/useCrateDrawer.hook";
import { useCrateMigration } from "src/hooks/useCrateMigration.hook";
import { buildCrateLayout } from "src/lib/crate-layout";
import { clearUserScopedQueries } from "src/lib/user-scoped-queries";
import type { DiscogsRelease } from "src/types";
import type {
  CrateLayoutItem,
  CrateLayoutPutRequest,
  CrateUpdatePayload,
  CrateWithCount,
} from "src/types/crate.types";
import { resolveActiveCrateId } from "src/utils/crateProviderActiveCrate";
import { toast } from "src/utils/toast";

const EMPTY_CRATES: CrateWithCount[] = [];

export const useCrateProvider = (): {
  stateValue: CrateState;
  actionsValue: CrateActions;
} => {
  const {
    state: { userId, isAuthenticated, rateLimited, isCheckingAuth },
    logout,
  } = useAuth();
  const queryClient = useQueryClient();
  const [activeCrateId, setActiveCrateId] = useState<string | null>(null);
  const prevUserIdRef = useRef<string | null>(userId);
  const mismatchRefetchKeyRef = useRef<string | null>(null);
  const {
    isDrawerOpen,
    isDesktop,
    toggleDrawer,
    openDrawer,
    closeDrawer,
    resetDrawer,
  } = useCrateDrawer();

  const canLoadCrates =
    isAuthenticated && !!userId && !rateLimited && !isCheckingAuth;

  const {
    data: cratesData,
    isLoading,
    isError,
    error,
  } = useCratesQuery({
    userId,
    enabled: canLoadCrates,
  });
  const crates = cratesData?.crates ?? EMPTY_CRATES;

  const effectiveActiveCrateId = useMemo(
    () => resolveActiveCrateId({ crates, activeCrateId }),
    [crates, activeCrateId],
  );

  const ensureActiveCrateIdPersisted = useCallback(() => {
    if (!activeCrateId && effectiveActiveCrateId) {
      setActiveCrateId(effectiveActiveCrateId);
    }
  }, [activeCrateId, effectiveActiveCrateId]);

  const {
    data: activeCrateData,
    isPending: isPendingCrate,
    isLoading: isLoadingCrate,
    isFetching: isFetchingCrate,
    isError: isCrateError,
  } = useCrateQuery({
    userId,
    crateId: effectiveActiveCrateId,
    enabled: canLoadCrates,
  });
  const crateReleaseItems = activeCrateData?.releases ?? [];
  const crateMarkers = activeCrateData?.markers ?? [];

  const packedReleaseCount = useMemo(
    () => crateReleaseItems.filter((item) => item.found_at !== null).length,
    [crateReleaseItems],
  );

  const createCrateMutation = useCreateCrateMutation(userId);
  const updateCrateMutation = useUpdateCrateMutation(userId);
  const updateCrateLayoutMutation = useUpdateCrateLayoutMutation(userId);
  const deleteCrateMutation = useDeleteCrateMutation(userId);
  const addReleaseMutation = useAddReleaseToCrateMutation(userId);
  const removeReleaseMutation = useRemoveReleaseFromCrateMutation(userId);
  const setMembershipMutation = useSetReleaseCrateMembershipMutation(userId);
  const setPackedMutation = useSetReleasePackedInCrateMutation(userId);
  const clearAllPackedMutation = useClearAllPackedInCrateMutation(userId);

  useCrateMigration(canLoadCrates, isLoading);

  useEffect(() => {
    const previousUserId = prevUserIdRef.current;
    if (previousUserId === userId) {
      return;
    }

    setActiveCrateId(null);

    if (!previousUserId && userId) {
      mismatchRefetchKeyRef.current = null;
      resetDrawer();
      void queryClient.invalidateQueries({
        queryKey: CratesQueryKeys.byUserId(userId),
      });
      void queryClient.invalidateQueries({
        queryKey: CrateQueryKeys.byUserId(userId),
      });
    } else {
      closeDrawer();
    }

    if (previousUserId) {
      queryClient.removeQueries({
        queryKey: CratesQueryKeys.byUserId(previousUserId),
      });
      queryClient.removeQueries({
        queryKey: CrateQueryKeys.byUserId(previousUserId),
      });
    }

    prevUserIdRef.current = userId;
  }, [userId, queryClient, closeDrawer, resetDrawer]);

  useEffect(() => {
    if (!userId || crates.length === 0) {
      return;
    }

    const expectedUserId = Number.parseInt(userId, 10);
    if (Number.isNaN(expectedUserId)) {
      return;
    }

    const hasOwnershipMismatch = crates.some(
      (crate) => crate.user_id !== expectedUserId,
    );

    if (hasOwnershipMismatch) {
      console.error("Crate ownership mismatch detected; clearing session.");
      clearUserScopedQueries(queryClient);
      void logout();
    }
  }, [crates, userId, queryClient, logout]);

  useEffect(() => {
    if (
      !(effectiveActiveCrateId && userId && canLoadCrates) ||
      isLoadingCrate ||
      isFetchingCrate ||
      isCrateError ||
      addReleaseMutation.isPending ||
      removeReleaseMutation.isPending ||
      setMembershipMutation.isPending
    ) {
      return;
    }

    const crateSummary = crates.find(
      (crate) => crate.id === effectiveActiveCrateId,
    );
    const expectedReleaseCount = crateSummary?.releaseCount ?? 0;
    const mismatchKey = `${userId}:${effectiveActiveCrateId}`;

    if (
      expectedReleaseCount !== crateReleaseItems.length &&
      mismatchRefetchKeyRef.current !== mismatchKey
    ) {
      mismatchRefetchKeyRef.current = mismatchKey;
      void queryClient.invalidateQueries({
        queryKey: CrateQueryKeys.byUserAndId(userId, effectiveActiveCrateId),
        refetchType: "active",
      });
    }
  }, [
    effectiveActiveCrateId,
    addReleaseMutation.isPending,
    canLoadCrates,
    crateReleaseItems.length,
    crates,
    isCrateError,
    isFetchingCrate,
    isLoadingCrate,
    queryClient,
    removeReleaseMutation.isPending,
    setMembershipMutation.isPending,
    userId,
  ]);

  const layoutItems = useMemo(
    () =>
      buildCrateLayout({
        releases: crateReleaseItems,
        markers: crateMarkers,
      }),
    [crateMarkers, crateReleaseItems],
  );

  const selectedReleases = useMemo(
    () => crateReleaseItems.map((item) => item.release),
    [crateReleaseItems],
  );

  const activeCrateInstanceIds = useMemo(
    () =>
      new Set(
        crateReleaseItems.map((item) => String(item.release.instance_id)),
      ),
    [crateReleaseItems],
  );

  const addReleaseToCrate = useCallback(
    (
      crateId: string,
      release: DiscogsRelease,
      options?: { openDrawer?: boolean },
    ) => {
      if (isLoading) return;

      if (isError) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        if (
          errorMessage.includes("Database not initialized") ||
          errorMessage.includes("Prisma Client") ||
          errorMessage.includes("DATABASE_URL")
        ) {
          toast.error(
            "Database not set up. Please run 'pnpm db:generate' and 'pnpm db:push' in your terminal.",
          );
        }
        return;
      }

      if (!crateId) return;

      addReleaseMutation.mutate(
        {
          crateId,
          release,
        },
        {
          onSuccess: () => {
            trackCrateReleaseAdded(release.instance_id);
            if (options?.openDrawer && isDesktop) {
              openDrawer();
            }
          },
        },
      );
    },
    [isLoading, isError, error, addReleaseMutation, openDrawer, isDesktop],
  );

  const addToCrate = useCallback(
    (release: DiscogsRelease) => {
      if (!effectiveActiveCrateId) {
        return;
      }

      ensureActiveCrateIdPersisted();

      addReleaseToCrate(effectiveActiveCrateId, release, { openDrawer: true });
    },
    [addReleaseToCrate, effectiveActiveCrateId, ensureActiveCrateIdPersisted],
  );

  const removeReleaseFromCrate = useCallback(
    (crateId: string, releaseId: string | number) => {
      if (!crateId) return;

      removeReleaseMutation.mutate(
        {
          crateId,
          releaseId: String(releaseId),
        },
        {
          onSuccess: () => {
            trackCrateReleaseRemoved(releaseId);
          },
        },
      );
    },
    [removeReleaseMutation],
  );

  const removeFromCrate = useCallback(
    (releaseId: string | number) => {
      if (!effectiveActiveCrateId) {
        return;
      }

      ensureActiveCrateIdPersisted();

      removeReleaseFromCrate(effectiveActiveCrateId, releaseId);
    },
    [
      effectiveActiveCrateId,
      ensureActiveCrateIdPersisted,
      removeReleaseFromCrate,
    ],
  );

  const isInCrate = useCallback(
    (releaseId: string | number) =>
      activeCrateInstanceIds.has(String(releaseId)),
    [activeCrateInstanceIds],
  );

  const setReleaseCrateMembership = useCallback(
    (
      crateIds: string[],
      release: DiscogsRelease,
      options?: { openDrawer?: boolean },
    ) => {
      setMembershipMutation.mutate(
        { crateIds, release },
        {
          onSuccess: () => {
            if (
              options?.openDrawer &&
              effectiveActiveCrateId &&
              crateIds.includes(effectiveActiveCrateId) &&
              isDesktop
            ) {
              openDrawer();
            }
          },
        },
      );
    },
    [effectiveActiveCrateId, isDesktop, openDrawer, setMembershipMutation],
  );

  const isPacked = useCallback(
    (releaseId: string | number) =>
      crateReleaseItems.some(
        (item) =>
          String(item.release.instance_id) === String(releaseId) &&
          item.found_at !== null,
      ),
    [crateReleaseItems],
  );

  const setPacked = useCallback(
    (releaseId: string | number, packed: boolean) => {
      if (!effectiveActiveCrateId) {
        return;
      }

      ensureActiveCrateIdPersisted();

      const crateToUpdate = crates.find(
        (crate) => crate.id === effectiveActiveCrateId,
      );
      if (!crateToUpdate?.packed_enabled) return;

      setPackedMutation.mutate(
        {
          crateId: effectiveActiveCrateId,
          releaseId: String(releaseId),
          found: packed,
        },
        {
          onSuccess: () => {
            trackReleasePacked(releaseId, packed);
          },
        },
      );
    },
    [
      crates,
      effectiveActiveCrateId,
      ensureActiveCrateIdPersisted,
      setPackedMutation,
    ],
  );

  const clearAllPacked = useCallback(() => {
    if (!effectiveActiveCrateId) return;

    const activeCrate = crates.find(
      (crate) => crate.id === effectiveActiveCrateId,
    );
    if (!activeCrate?.packed_enabled) return;

    clearAllPackedMutation.mutate(
      { crateId: effectiveActiveCrateId },
      {
        onSuccess: () => {
          trackCratePackedCleared(effectiveActiveCrateId);
        },
      },
    );
  }, [clearAllPackedMutation, crates, effectiveActiveCrateId]);

  const clearCrate = useCallback(() => {
    if (!effectiveActiveCrateId) return;

    const releaseCount = selectedReleases.length;
    if (releaseCount === 0) {
      return;
    }

    trackCrateCleared(releaseCount);

    selectedReleases.forEach((release) => {
      removeReleaseMutation.mutate({
        crateId: effectiveActiveCrateId,
        releaseId: release.instance_id,
      });
    });
  }, [effectiveActiveCrateId, selectedReleases, removeReleaseMutation]);

  const createCrate = useCallback(
    async (name: string, options?: { setAsDefault?: boolean }) => {
      const result = await createCrateMutation.mutateAsync({ name });
      const crateId = result?.crate?.id ?? null;

      if (!crateId) {
        return null;
      }

      trackCrateCreated(crateId);

      if (options?.setAsDefault) {
        await updateCrateMutation.mutateAsync({
          crateId,
          updates: { is_default: true },
        });
      }

      setActiveCrateId(crateId);
      return crateId;
    },
    [createCrateMutation, updateCrateMutation],
  );

  const selectCrate = useCallback((crateId: string) => {
    setActiveCrateId(crateId);
  }, []);

  const updateCrate = useCallback(
    async (crateId: string, updates: Partial<CrateUpdatePayload>) => {
      await updateCrateMutation.mutateAsync({
        crateId,
        updates,
      });

      if ("private" in updates && typeof updates.private === "boolean") {
        trackCrateVisibilityChanged(crateId, !updates.private);
      }

      if (
        "packed_enabled" in updates &&
        typeof updates.packed_enabled === "boolean"
      ) {
        trackCratePackingEnabled(crateId, updates.packed_enabled);
      }

      if ("notes" in updates) {
        trackCrateNotesSaved(crateId);
      }
    },
    [updateCrateMutation],
  );

  const deleteCrate = useCallback(
    async (crateId: string) => {
      await deleteCrateMutation.mutateAsync(crateId);
      trackCrateDeleted(crateId);

      if (crateId === effectiveActiveCrateId) {
        setActiveCrateId(null);
      }
    },
    [deleteCrateMutation, effectiveActiveCrateId],
  );

  const updateCrateLayout = useCallback(
    (
      crateId: string,
      params: {
        layout: CrateLayoutPutRequest;
        optimisticLayoutItems: CrateLayoutItem[];
      },
    ) => {
      updateCrateLayoutMutation.mutate({
        crateId,
        layout: params.layout,
        optimisticLayoutItems: params.optimisticLayoutItems,
      });
    },
    [updateCrateLayoutMutation],
  );

  const stateValue: CrateState = useMemo(
    () => ({
      crates,
      activeCrateId: effectiveActiveCrateId,
      activeCrateInstanceIds,
      selectedReleases,
      layoutItems,
      isLoading,
      isPendingCrate,
      isLoadingCrate,
      isFetchingCrate,
      isDrawerOpen,
      packedReleaseCount,
      isUpdatingCrate: updateCrateMutation.isPending,
      isUpdatingCrateLayout: updateCrateLayoutMutation.isPending,
      isCreatingCrate: createCrateMutation.isPending,
      isDeletingCrate: deleteCrateMutation.isPending,
    }),
    [
      crates,
      effectiveActiveCrateId,
      activeCrateInstanceIds,
      selectedReleases,
      layoutItems,
      isLoading,
      isPendingCrate,
      isLoadingCrate,
      isFetchingCrate,
      isDrawerOpen,
      packedReleaseCount,
      updateCrateMutation.isPending,
      updateCrateLayoutMutation.isPending,
      createCrateMutation.isPending,
      deleteCrateMutation.isPending,
    ],
  );

  const actionsValue: CrateActions = useMemo(
    () => ({
      addToCrate,
      addReleaseToCrate,
      removeFromCrate,
      removeReleaseFromCrate,
      setReleaseCrateMembership,
      isInCrate,
      isPacked,
      setPacked,
      clearAllPacked,
      clearCrate,
      createCrate,
      selectCrate,
      updateCrate,
      updateCrateLayout,
      deleteCrate,
      toggleDrawer,
      openDrawer,
      closeDrawer,
    }),
    [
      addToCrate,
      addReleaseToCrate,
      removeFromCrate,
      removeReleaseFromCrate,
      setReleaseCrateMembership,
      isInCrate,
      isPacked,
      setPacked,
      clearAllPacked,
      clearCrate,
      createCrate,
      selectCrate,
      updateCrate,
      updateCrateLayout,
      deleteCrate,
      toggleDrawer,
      openDrawer,
      closeDrawer,
    ],
  );

  return { stateValue, actionsValue };
};
