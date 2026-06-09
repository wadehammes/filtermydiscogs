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
import { useAuth } from "src/context/auth.context";
import {
  CrateQueryKeys,
  CratesQueryKeys,
} from "src/hooks/queries/querykeys.constants";
import {
  useAddReleaseToCrateMutation,
  useCreateCrateMutation,
  useDeleteCrateMutation,
  useRemoveReleaseFromCrateMutation,
  useUpdateCrateMutation,
} from "src/hooks/queries/useCrateMutations";
import {
  useCrateQuery,
  useCratesQuery,
} from "src/hooks/queries/useCratesQuery";
import { useCrateDrawer } from "src/hooks/useCrateDrawer.hook";
import { useCrateMigration } from "src/hooks/useCrateMigration.hook";
import type { DiscogsRelease } from "src/types";
import type { Crate, CrateWithCount } from "src/types/crate.types";

interface CrateContextType {
  crates: CrateWithCount[];
  activeCrateId: string | null;
  selectedReleases: DiscogsRelease[];
  isLoading: boolean;
  isLoadingCrate: boolean;
  isFetchingCrate: boolean;
  addToCrate: (release: DiscogsRelease) => void;
  removeFromCrate: (releaseId: string) => void;
  isInCrate: (releaseId: string) => boolean;
  clearCrate: () => void;
  createCrate: (name: string) => Promise<void>;
  selectCrate: (crateId: string) => void;
  updateCrate: (crateId: string, updates: Partial<Crate>) => Promise<void>;
  deleteCrate: (crateId: string) => Promise<void>;
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  isUpdatingCrate: boolean;
  isDeletingCrate: boolean;
}

const CrateContext = createContext<CrateContextType | undefined>(undefined);

interface CrateProviderProps {
  children: ReactNode;
}

export const CrateProvider = ({ children }: CrateProviderProps) => {
  const {
    state: { userId, isAuthenticated, rateLimited },
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

  const canLoadCrates = isAuthenticated && !!userId && !rateLimited;

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
    isLoading: isLoadingCrate,
    isFetching: isFetchingCrate,
    isError: isCrateError,
    refetch: refetchActiveCrate,
  } = useCrateQuery({
    userId,
    crateId: activeCrateId,
    enabled: canLoadCrates,
  });
  const activeCrateReleases = activeCrateData?.releases || [];

  const createCrateMutation = useCreateCrateMutation(userId);
  const updateCrateMutation = useUpdateCrateMutation(userId);
  const deleteCrateMutation = useDeleteCrateMutation(userId);
  const addReleaseMutation = useAddReleaseToCrateMutation(userId);
  const removeReleaseMutation = useRemoveReleaseFromCrateMutation(userId);

  const findDefaultCrate = useCallback(
    ({ crateList }: { crateList: typeof crates }) =>
      crateList.find((c) => c.is_default) || crateList[0],
    [],
  );

  useCrateMigration(
    canLoadCrates,
    isLoading,
    crates,
    findDefaultCrate,
    addReleaseMutation,
  );

  useEffect(() => {
    const previousUserId = prevUserIdRef.current;
    if (previousUserId === userId) {
      return;
    }

    setActiveCrateId(null);

    if (!previousUserId && userId) {
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
      isCrateError
    ) {
      return;
    }

    const crateSummary = crates.find((crate) => crate.id === activeCrateId);
    const expectedReleaseCount = crateSummary?.releaseCount ?? 0;
    const mismatchKey = `${userId}:${activeCrateId}`;

    if (
      expectedReleaseCount > 0 &&
      activeCrateReleases.length === 0 &&
      mismatchRefetchKeyRef.current !== mismatchKey
    ) {
      mismatchRefetchKeyRef.current = mismatchKey;
      void refetchActiveCrate();
    }
  }, [
    activeCrateId,
    activeCrateReleases.length,
    canLoadCrates,
    crates,
    isCrateError,
    isFetchingCrate,
    isLoadingCrate,
    refetchActiveCrate,
    userId,
  ]);

  const selectedReleases = activeCrateReleases;

  const addToCrate = useCallback(
    (release: DiscogsRelease) => {
      if (isLoading) return;

      if (isError) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        if (
          errorMessage.includes("Database not initialized") ||
          errorMessage.includes("Prisma Client") ||
          errorMessage.includes("DATABASE_URL")
        ) {
          alert(
            "Database not set up. Please run 'pnpm db:generate' and 'pnpm db:push' in your terminal.",
          );
        }
        return;
      }

      let crateIdToUse = activeCrateId;

      if (!crateIdToUse) {
        const defaultCrate = findDefaultCrate({ crateList: crates });
        if (defaultCrate) {
          crateIdToUse = defaultCrate.id;
          setActiveCrateId(defaultCrate.id);
        }
      }

      if (!crateIdToUse) return;

      addReleaseMutation.mutate(
        {
          crateId: crateIdToUse,
          release,
        },
        {
          onSuccess: () => {
            if (isDesktop) {
              openDrawer();
            }
          },
        },
      );
    },
    [
      isLoading,
      isError,
      error,
      activeCrateId,
      crates,
      findDefaultCrate,
      addReleaseMutation,
      openDrawer,
      isDesktop,
    ],
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

      removeReleaseMutation.mutate({
        crateId: crateIdToUse,
        releaseId: String(releaseId),
      });
    },
    [activeCrateId, crates, findDefaultCrate, removeReleaseMutation],
  );

  const isInCrate = useCallback(
    (releaseId: string | number) =>
      activeCrateReleases.some(
        (r) => String(r.instance_id) === String(releaseId),
      ),
    [activeCrateReleases],
  );

  const clearCrate = useCallback(() => {
    if (!activeCrateId) return;

    activeCrateReleases.forEach((release) => {
      removeReleaseMutation.mutate({
        crateId: activeCrateId,
        releaseId: release.instance_id,
      });
    });
  }, [activeCrateId, activeCrateReleases, removeReleaseMutation]);

  const createCrate = useCallback(
    async (name: string) => {
      const result = await createCrateMutation.mutateAsync({ name });
      if (result?.crate?.id) {
        setActiveCrateId(result.crate.id);
      }
    },
    [createCrateMutation],
  );

  const selectCrate = useCallback((crateId: string) => {
    setActiveCrateId(crateId);
  }, []);

  const updateCrate = useCallback(
    async (crateId: string, updates: Partial<Crate>) => {
      const updateData: {
        name?: string;
        is_default?: boolean;
        private?: boolean;
      } = {};
      if (updates.name !== undefined) {
        updateData.name = updates.name;
      }
      if (updates.is_default !== undefined) {
        updateData.is_default = updates.is_default;
      }
      if (updates.private !== undefined) {
        updateData.private = updates.private;
      }
      await updateCrateMutation.mutateAsync({
        crateId,
        updates: updateData,
      });
    },
    [updateCrateMutation],
  );

  const deleteCrate = useCallback(
    async (crateId: string) => {
      await deleteCrateMutation.mutateAsync(crateId);

      if (crateId === activeCrateId) {
        // Switch to default crate if the deleted crate was active
        // Use optimistic update: filter out deleted crate and find default
        const remainingCrates = crates.filter((c) => c.id !== crateId);
        const defaultCrate = findDefaultCrate({ crateList: remainingCrates });
        if (defaultCrate) {
          setActiveCrateId(defaultCrate.id);
        } else if (remainingCrates.length > 0) {
          // Fallback to first crate if no default
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

  const value: CrateContextType = useMemo(
    () => ({
      crates,
      activeCrateId,
      selectedReleases,
      isLoading,
      isLoadingCrate,
      isFetchingCrate,
      addToCrate,
      removeFromCrate,
      isInCrate,
      clearCrate,
      createCrate,
      selectCrate,
      updateCrate,
      deleteCrate,
      isDrawerOpen,
      toggleDrawer,
      openDrawer,
      closeDrawer,
      isUpdatingCrate: updateCrateMutation.isPending,
      isDeletingCrate: deleteCrateMutation.isPending,
    }),
    [
      crates,
      activeCrateId,
      selectedReleases,
      isLoading,
      isLoadingCrate,
      isFetchingCrate,
      addToCrate,
      removeFromCrate,
      isInCrate,
      clearCrate,
      createCrate,
      selectCrate,
      updateCrate,
      deleteCrate,
      isDrawerOpen,
      toggleDrawer,
      openDrawer,
      closeDrawer,
      updateCrateMutation.isPending,
      deleteCrateMutation.isPending,
    ],
  );

  return (
    <CrateContext.Provider value={value}>{children}</CrateContext.Provider>
  );
};

export const useCrate = (): CrateContextType => {
  const context = useContext(CrateContext);
  if (context === undefined) {
    throw new Error("useCrate must be used within a CrateProvider");
  }
  return context;
};
