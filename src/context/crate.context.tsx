"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import {
  useAddReleaseToCrateMutation,
  useClearAllPackedInCrateMutation,
  useCreateCrateMutation,
  useDeleteCrateMutation,
  useRemoveReleaseFromCrateMutation,
  useSetReleaseCrateMembershipMutation,
  useSetReleasePackedInCrateMutation,
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
import type { DiscogsRelease } from "src/types";
import type {
  CrateLayoutItem,
  CrateUpdatePayload,
  CrateWithCount,
} from "src/types/crate.types";
import { toast } from "src/utils/toast";

interface CrateState {
  crates: CrateWithCount[];
  activeCrateId: string | null;
  activeCrateInstanceIds: ReadonlySet<string>;
  selectedReleases: DiscogsRelease[];
  layoutItems: CrateLayoutItem[];
  isLoading: boolean;
  isPendingCrate: boolean;
  isLoadingCrate: boolean;
  isFetchingCrate: boolean;
  isDrawerOpen: boolean;
  packedReleaseCount: number;
  isUpdatingCrate: boolean;
  isCreatingCrate: boolean;
  isDeletingCrate: boolean;
}

interface CrateActions {
  addToCrate: (release: DiscogsRelease) => void;
  addReleaseToCrate: (
    crateId: string,
    release: DiscogsRelease,
    options?: { openDrawer?: boolean },
  ) => void;
  removeFromCrate: (releaseId: string) => void;
  removeReleaseFromCrate: (crateId: string, releaseId: string) => void;
  setReleaseCrateMembership: (
    crateIds: string[],
    release: DiscogsRelease,
    options?: { openDrawer?: boolean },
  ) => void;
  isInCrate: (releaseId: string) => boolean;
  isPacked: (releaseId: string) => boolean;
  setPacked: (releaseId: string, packed: boolean) => void;
  clearAllPacked: () => void;
  clearCrate: () => void;
  createCrate: (
    name: string,
    options?: { setAsDefault?: boolean },
  ) => Promise<string | null>;
  selectCrate: (crateId: string) => void;
  updateCrate: (
    crateId: string,
    updates: Partial<CrateUpdatePayload>,
  ) => Promise<void>;
  deleteCrate: (crateId: string) => Promise<void>;
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export type CrateContextType = CrateState & CrateActions;

const CrateStateContext = createContext<CrateState | undefined>(undefined);
const CrateActionsContext = createContext<CrateActions | undefined>(undefined);

interface CrateProviderProps {
  children: ReactNode;
}

export const CrateProvider = ({ children }: CrateProviderProps) => {
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
  const crates = cratesData?.crates || [];

  const {
    data: activeCrateData,
    isPending: isPendingCrate,
    isLoading: isLoadingCrate,
    isFetching: isFetchingCrate,
    isError: isCrateError,
  } = useCrateQuery({
    userId,
    crateId: activeCrateId,
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
  const deleteCrateMutation = useDeleteCrateMutation(userId);
  const addReleaseMutation = useAddReleaseToCrateMutation(userId);
  const removeReleaseMutation = useRemoveReleaseFromCrateMutation(userId);
  const setMembershipMutation = useSetReleaseCrateMembershipMutation(userId);
  const setPackedMutation = useSetReleasePackedInCrateMutation(userId);
  const clearAllPackedMutation = useClearAllPackedInCrateMutation(userId);

  const findDefaultCrate = useCallback(
    ({ crateList }: { crateList: typeof crates }) =>
      crateList.find((c) => c.is_default) || crateList[0],
    [],
  );

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
      queryClient.clear();
      void logout();
    }
  }, [crates, userId, queryClient, logout]);

  useEffect(() => {
    if (!userId || crates.length === 0) {
      return;
    }

    setActiveCrateId((currentActiveCrateId) => {
      const hasActiveCrate =
        currentActiveCrateId &&
        crates.some((crate) => crate.id === currentActiveCrateId);

      if (hasActiveCrate) {
        return currentActiveCrateId;
      }

      const defaultCrate = findDefaultCrate({ crateList: crates });

      return defaultCrate?.id ?? null;
    });
  }, [crates, findDefaultCrate, userId]);

  useEffect(() => {
    if (
      !(activeCrateId && userId && canLoadCrates) ||
      isLoadingCrate ||
      isFetchingCrate ||
      isCrateError ||
      addReleaseMutation.isPending ||
      removeReleaseMutation.isPending ||
      setMembershipMutation.isPending
    ) {
      return;
    }

    const crateSummary = crates.find((crate) => crate.id === activeCrateId);
    const expectedReleaseCount = crateSummary?.releaseCount ?? 0;
    const mismatchKey = `${userId}:${activeCrateId}`;

    if (
      expectedReleaseCount !== crateReleaseItems.length &&
      mismatchRefetchKeyRef.current !== mismatchKey
    ) {
      mismatchRefetchKeyRef.current = mismatchKey;
      void queryClient.invalidateQueries({
        queryKey: CrateQueryKeys.byUserAndId(userId, activeCrateId),
        refetchType: "active",
      });
    }
  }, [
    activeCrateId,
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
      let crateIdToUse = activeCrateId;

      if (!crateIdToUse) {
        const defaultCrate = findDefaultCrate({ crateList: crates });
        if (defaultCrate) {
          crateIdToUse = defaultCrate.id;
          setActiveCrateId(defaultCrate.id);
        }
      }

      if (!crateIdToUse) return;

      addReleaseToCrate(crateIdToUse, release, { openDrawer: true });
    },
    [activeCrateId, crates, findDefaultCrate, addReleaseToCrate],
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
      let crateIdToUse = activeCrateId;

      if (!crateIdToUse && crates.length > 0) {
        const defaultCrate = findDefaultCrate({ crateList: crates });
        if (defaultCrate) {
          crateIdToUse = defaultCrate.id;
          setActiveCrateId(defaultCrate.id);
        }
      }

      if (!crateIdToUse) return;

      removeReleaseFromCrate(crateIdToUse, releaseId);
    },
    [activeCrateId, crates, findDefaultCrate, removeReleaseFromCrate],
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
              activeCrateId &&
              crateIds.includes(activeCrateId) &&
              isDesktop
            ) {
              openDrawer();
            }
          },
        },
      );
    },
    [activeCrateId, isDesktop, openDrawer, setMembershipMutation],
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
      let crateIdToUse = activeCrateId;

      if (!crateIdToUse && crates.length > 0) {
        const defaultCrate = findDefaultCrate({ crateList: crates });
        if (defaultCrate) {
          crateIdToUse = defaultCrate.id;
          setActiveCrateId(defaultCrate.id);
        }
      }

      if (!crateIdToUse) return;

      const crateToUpdate = crates.find((crate) => crate.id === crateIdToUse);
      if (!crateToUpdate?.packed_enabled) return;

      setPackedMutation.mutate(
        {
          crateId: crateIdToUse,
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
    [activeCrateId, crates, findDefaultCrate, setPackedMutation],
  );

  const clearAllPacked = useCallback(() => {
    if (!activeCrateId) return;

    const activeCrate = crates.find((crate) => crate.id === activeCrateId);
    if (!activeCrate?.packed_enabled) return;

    clearAllPackedMutation.mutate(
      { crateId: activeCrateId },
      {
        onSuccess: () => {
          trackCratePackedCleared(activeCrateId);
        },
      },
    );
  }, [activeCrateId, clearAllPackedMutation, crates]);

  const clearCrate = useCallback(() => {
    if (!activeCrateId) return;

    const releaseCount = selectedReleases.length;
    if (releaseCount === 0) {
      return;
    }

    trackCrateCleared(releaseCount);

    selectedReleases.forEach((release) => {
      removeReleaseMutation.mutate({
        crateId: activeCrateId,
        releaseId: release.instance_id,
      });
    });
  }, [activeCrateId, selectedReleases, removeReleaseMutation]);

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

      if (crateId === activeCrateId) {
        const remainingCrates = crates.filter((c) => c.id !== crateId);
        const defaultCrate = findDefaultCrate({ crateList: remainingCrates });
        if (defaultCrate) {
          setActiveCrateId(defaultCrate.id);
        } else if (remainingCrates.length > 0) {
          const firstCrate = remainingCrates[0];
          if (firstCrate) {
            setActiveCrateId(firstCrate.id);
          } else {
            setActiveCrateId(null);
          }
        } else {
          setActiveCrateId(null);
        }
      }
    },
    [activeCrateId, crates, deleteCrateMutation, findDefaultCrate],
  );

  const stateValue: CrateState = useMemo(
    () => ({
      crates,
      activeCrateId,
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
      isCreatingCrate: createCrateMutation.isPending,
      isDeletingCrate: deleteCrateMutation.isPending,
    }),
    [
      crates,
      activeCrateId,
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
      deleteCrate,
      toggleDrawer,
      openDrawer,
      closeDrawer,
    ],
  );

  return (
    <CrateStateContext.Provider value={stateValue}>
      <CrateActionsContext.Provider value={actionsValue}>
        {children}
      </CrateActionsContext.Provider>
    </CrateStateContext.Provider>
  );
};

export const useCrateState = (): CrateState => {
  const context = useContext(CrateStateContext);
  if (context === undefined) {
    throw new Error("useCrateState must be used within a CrateProvider");
  }
  return context;
};

export const useCrateActions = (): CrateActions => {
  const context = useContext(CrateActionsContext);
  if (context === undefined) {
    throw new Error("useCrateActions must be used within a CrateProvider");
  }
  return context;
};

export const useCrate = (): CrateContextType => {
  const state = useContext(CrateStateContext);
  const actions = useContext(CrateActionsContext);
  if (state === undefined || actions === undefined) {
    throw new Error("useCrate must be used within a CrateProvider");
  }
  return { ...state, ...actions };
};
