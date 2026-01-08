"use client";

import React, {
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
import { useCrateSync } from "src/hooks/useCrateSync.hook";
import type { DiscogsRelease } from "src/types";
import type { Crate } from "src/types/crate.types";

interface CrateContextType {
  crates: Crate[];
  activeCrateId: string | null;
  selectedReleases: DiscogsRelease[];
  isLoading: boolean;
  isLoadingCrate: boolean;
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

const STORAGE_KEY = "filtermydiscogs_selected_releases";

export const CrateProvider: React.FC<CrateProviderProps> = ({ children }) => {
  const { state: authState } = useAuth();
  const [activeCrateId, setActiveCrateId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);
  const hasSetInitialDrawerState = useRef(false);

  const { data: cratesData, isLoading, isError, error } = useCratesQuery();
  const crates = cratesData?.crates || [];

  const { data: activeCrateData, isLoading: isLoadingCrate } =
    useCrateQuery(activeCrateId);
  const activeCrateReleases = activeCrateData?.releases || [];

  useCrateSync();

  const createCrateMutation = useCreateCrateMutation();
  const updateCrateMutation = useUpdateCrateMutation();
  const deleteCrateMutation = useDeleteCrateMutation();
  const addReleaseMutation = useAddReleaseToCrateMutation();
  const removeReleaseMutation = useRemoveReleaseFromCrateMutation();

  const findDefaultCrate = useCallback(
    ({ crateList }: { crateList: typeof crates }) =>
      crateList.find((c) => c.is_default) || crateList[0],
    [],
  );

  useEffect(() => {
    if (crates.length === 0) return;

    const hasActiveCrate =
      activeCrateId && crates.some((c) => c.id === activeCrateId);
    if (!hasActiveCrate) {
      const defaultCrate = findDefaultCrate({ crateList: crates });
      if (defaultCrate) {
        setActiveCrateId(defaultCrate.id);
      }
    }
  }, [crates, activeCrateId, findDefaultCrate]);

  useEffect(() => {
    if (
      !authState.isAuthenticated ||
      isLoading ||
      migrationDone ||
      crates.length === 0
    ) {
      return;
    }

    const migrateLocalStorage = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
          setMigrationDone(true);
          return;
        }

        const parsed = JSON.parse(stored) as DiscogsRelease[];
        if (!Array.isArray(parsed) || parsed.length === 0) {
          localStorage.removeItem(STORAGE_KEY);
          setMigrationDone(true);
          return;
        }

        const defaultCrate = findDefaultCrate({ crateList: crates });
        if (!defaultCrate) {
          setMigrationDone(true);
          return;
        }

        for (const release of parsed) {
          try {
            await addReleaseMutation.mutateAsync({
              crateId: defaultCrate.id,
              release,
            });
          } catch {
            // Continue with other releases even if one fails
          }
        }

        localStorage.removeItem(STORAGE_KEY);
        setMigrationDone(true);
      } catch {
        setMigrationDone(true);
      }
    };

    migrateLocalStorage();
  }, [
    authState.isAuthenticated,
    isLoading,
    migrationDone,
    crates,
    addReleaseMutation,
    findDefaultCrate,
  ]);

  // Set initial drawer state based on screen size - open on desktop, closed on mobile
  useEffect(() => {
    if (!hasSetInitialDrawerState.current) {
      // Check media query directly to avoid dependency array issues
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(min-width: 1024px)").matches
      ) {
        setIsDrawerOpen(true);
      }
      hasSetInitialDrawerState.current = true;
    }
    // Only run once on mount
  }, []);

  const selectedReleases = activeCrateReleases;
  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

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
          onSuccess: openDrawer,
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
      const updateData: { name?: string; is_default?: boolean } = {};
      if (updates.name !== undefined) {
        updateData.name = updates.name;
      }
      if (updates.is_default !== undefined) {
        updateData.is_default = updates.is_default;
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
