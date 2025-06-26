"use client";

import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { DiscogsRelease } from "src/types";

interface CrateContextType {
  selectedReleases: DiscogsRelease[];
  addToCrate: (release: DiscogsRelease) => void;
  removeFromCrate: (releaseId: string) => void;
  isInCrate: (releaseId: string) => boolean;
  clearCrate: () => void;
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CrateContext = createContext<CrateContextType | undefined>(undefined);

interface CrateProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = "filtermydiscogs_selected_releases";

export const CrateProvider: React.FC<CrateProviderProps> = ({ children }) => {
  const [selectedReleases, setSelectedReleases] = useState<DiscogsRelease[]>(
    [],
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSelectedReleases(parsed);
      }
    } catch (error) {
      console.error("Error loading releases from localStorage:", error);
    }
  }, []);

  // Save to localStorage whenever selectedReleases changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedReleases));
    } catch (error) {
      console.error("Error saving releases to localStorage:", error);
    }
  }, [selectedReleases]);

  const addToCrate = useCallback((release: DiscogsRelease) => {
    setSelectedReleases((prev) => {
      // Check if already in crate
      if (prev.some((r) => r.instance_id === release.instance_id)) {
        return prev;
      }
      return [...prev, release];
    });
  }, []);

  const removeFromCrate = useCallback((releaseId: string) => {
    setSelectedReleases((prev) =>
      prev.filter((r) => r.instance_id !== releaseId),
    );
  }, []);

  const isInCrate = useCallback(
    (releaseId: string) => {
      return selectedReleases.some((r) => r.instance_id === releaseId);
    },
    [selectedReleases],
  );

  const clearCrate = useCallback(() => {
    setSelectedReleases([]);
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const value: CrateContextType = useMemo(
    () => ({
      selectedReleases,
      addToCrate,
      removeFromCrate,
      isInCrate,
      clearCrate,
      isDrawerOpen,
      toggleDrawer,
      openDrawer,
      closeDrawer,
    }),
    [
      selectedReleases,
      addToCrate,
      removeFromCrate,
      isInCrate,
      clearCrate,
      isDrawerOpen,
      toggleDrawer,
      openDrawer,
      closeDrawer,
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
