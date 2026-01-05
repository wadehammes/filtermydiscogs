import { useQuery } from "@tanstack/react-query";
import { getUserIdFromCookies } from "src/services/auth.service";
import type {
  CratesResponse,
  CrateWithReleasesResponse,
} from "src/types/crate.types";

export const useCratesQuery = () => {
  const userId = getUserIdFromCookies();

  return useQuery<CratesResponse>({
    queryKey: ["crates", userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const response = await fetch("/api/crates", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch crates: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });
};

export const useCrateQuery = (crateId: string | null) => {
  const userId = getUserIdFromCookies();
  const isEnabled = Boolean(userId && crateId);

  return useQuery<CrateWithReleasesResponse>({
    queryKey: ["crate", userId, crateId],
    queryFn: async () => {
      if (!userId) {
        throw new Error("User not authenticated");
      }
      if (!crateId) {
        throw new Error("Crate ID missing");
      }

      const response = await fetch(`/api/crates/${crateId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch crate");
      }

      return response.json();
    },
    enabled: isEnabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });
};
